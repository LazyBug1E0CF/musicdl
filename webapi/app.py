from __future__ import annotations

import asyncio
import json
import os
import traceback
from pathlib import Path
from typing import Any

from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse

from webapi.schemas.music import (
    ApiError,
    DownloadRequest,
    ParsePlaylistRequest,
    SearchRequest,
    SongInfoSchema,
    TaskResponse,
)
from webapi.services.music_service import MusicService
from webapi.tasks.registry import TaskRegistry, TaskStatus


app = FastAPI(title="musicdl webapi", version="1.0.0")
registry = TaskRegistry(
    max_tasks_per_user=int(os.getenv("MUSICDL_MAX_TASKS_PER_USER", "2")),
    max_tasks_global=int(os.getenv("MUSICDL_MAX_TASKS_GLOBAL", "4")),
    ttl_seconds=int(os.getenv("MUSICDL_TASK_TTL_SECONDS", str(24 * 3600))),
)


def _song_to_schema(song_info):
    song_dict = song_info.todict()
    song_dict["path"] = song_info.save_path
    return SongInfoSchema.model_validate(song_dict).model_dump(by_alias=False)


def _error(code: str, message: str, source: str | None = None, detail: Any = None):
    return {"error": ApiError(code=code, message=message, source=source, detail=detail).model_dump()}


@app.exception_handler(HTTPException)
async def http_exception_handler(_, exc: HTTPException):
    detail = exc.detail if isinstance(exc.detail, dict) else {"message": str(exc.detail)}
    err = ApiError(
        code=detail.get("code", f"HTTP_{exc.status_code}"),
        message=detail.get("message", "request failed"),
        source=detail.get("source"),
        detail=detail.get("detail"),
    )
    return JSONResponse(status_code=exc.status_code, content={"error": err.model_dump()})


@app.exception_handler(Exception)
async def exception_handler(_, exc: Exception):
    err = ApiError(code="INTERNAL_ERROR", message="internal server error", detail=str(exc))
    return JSONResponse(status_code=500, content={"error": err.model_dump()})


@app.get("/api/v1/sources")
def get_sources():
    return {"sources": MusicService.get_available_sources()}


@app.post("/api/v1/search")
def search(payload: SearchRequest):
    try:
        results = MusicService.search(payload.keyword, payload.sources, payload.overrides.model_dump())
        return {"results": {source: [_song_to_schema(s) for s in songs] for source, songs in results.items()}}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=_error("SEARCH_FAILED", "search failed", detail=str(exc))["error"]) from exc


@app.post("/api/v1/playlist/parse")
def parse_playlist(payload: ParsePlaylistRequest):
    try:
        songs = MusicService.parse_playlist(payload.playlist_url, payload.sources, payload.overrides.model_dump())
        return {"songs": [_song_to_schema(s) for s in songs]}
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=_error("PLAYLIST_PARSE_FAILED", "playlist parse failed", detail=str(exc))["error"],
        ) from exc


async def _run_download(task_id: str, payload: DownloadRequest):
    await registry.update_task(task_id, status=TaskStatus.RUNNING)
    results: list[dict[str, Any]] = []
    try:
        songs = [s.model_dump() for s in payload.song_infos]
        total = len(songs)
        await registry.update_task(task_id, total=total)

        for idx, song in enumerate(songs, start=1):
            try:
                downloaded = await asyncio.to_thread(
                    MusicService.download,
                    [song],
                    payload.sources,
                    payload.overrides.model_dump(),
                )
                song_results = [_song_to_schema(s) for s in downloaded]
                results.extend(song_results)
                for item in song_results:
                    save_path = item.get("save_path")
                    if save_path and Path(save_path).exists():
                        await registry.add_artifact(task_id, save_path, str(Path(save_path).parent))
                await registry.append_log(task_id, f"[{idx}/{total}] done")
            except Exception as exc:
                task = await registry.get_task(task_id)
                await registry.update_task(task_id, failed=(task.failed if task else 0) + 1)
                await registry.append_log(task_id, f"[{idx}/{total}] failed: {exc}")
            finally:
                task = await registry.get_task(task_id)
                await registry.update_task(task_id, completed=(task.completed if task else 0) + 1)

        task = await registry.get_task(task_id)
        final_status = TaskStatus.SUCCESS if task and task.failed == 0 else TaskStatus.FAILED
        await registry.update_task(task_id, status=final_status, result=results)
    except Exception as exc:
        await registry.update_task(
            task_id,
            status=TaskStatus.FAILED,
            error=ApiError(
                code="DOWNLOAD_FAILED",
                message="download failed",
                detail={"error": str(exc), "traceback": traceback.format_exc()},
            ).model_dump(),
        )


@app.post("/api/v1/download", response_model=TaskResponse)
async def download(payload: DownloadRequest, x_user_id: str | None = Header(default="anonymous")):
    try:
        task = await registry.create_task(user_id=x_user_id or "anonymous", total=len(payload.song_infos))
    except RuntimeError as exc:
        raise HTTPException(status_code=429, detail=_error("TASK_LIMIT_EXCEEDED", str(exc))["error"]) from exc

    asyncio.create_task(_run_download(task.task_id, payload))
    return TaskResponse(task_id=task.task_id, status=task.status.value)


@app.get("/api/v1/tasks/{task_id}")
async def get_task(task_id: str):
    task = await registry.get_task(task_id)
    if not task:
        raise HTTPException(
            status_code=404,
            detail=_error("TASK_NOT_FOUND", "task not found", detail={"task_id": task_id})["error"],
        )
    return task.to_dict()


@app.get("/api/v1/tasks/{task_id}/stream")
async def stream_task(task_id: str):
    if not await registry.get_task(task_id):
        raise HTTPException(
            status_code=404,
            detail=_error("TASK_NOT_FOUND", "task not found", detail={"task_id": task_id})["error"],
        )

    async def gen():
        while True:
            task = await registry.get_task(task_id)
            if not task:
                break
            yield f"data: {json.dumps(task.to_dict(), ensure_ascii=False)}\n\n"
            if task.status in {TaskStatus.SUCCESS, TaskStatus.FAILED}:
                break
            await registry.wait_for_change(task_id)

    return StreamingResponse(gen(), media_type="text/event-stream")
