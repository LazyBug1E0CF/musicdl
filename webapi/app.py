from __future__ import annotations

import asyncio
import json
import os
import re
import time
import traceback
from collections import defaultdict, deque
from pathlib import Path
from typing import Any, Deque

from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from webapi.api.v1.lyrics import router as lyrics_router
from webapi.api.v1.playback import router as playback_router
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


APP_TIMEOUT_SECONDS = float(os.getenv("APP_TIMEOUT_SECONDS", "30"))
MAX_BODY_BYTES = int(os.getenv("MAX_BODY_BYTES", str(2 * 1024 * 1024)))
RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "60"))
RATE_LIMIT_WINDOW_SECONDS = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))
DOWNLOAD_ROOT = Path(os.getenv("DOWNLOAD_ROOT", "./downloads")).resolve()
CORS_ALLOW_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ALLOW_ORIGINS", "http://localhost:5173,http://localhost:8080").split(",")
    if origin.strip()
]
SAFE_FILE_CHARS = re.compile(r"[^a-zA-Z0-9._-]+")


class InMemoryRateLimiter:
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.buckets: dict[str, Deque[float]] = defaultdict(deque)

    def allow(self, key: str) -> bool:
        now = time.time()
        queue = self.buckets[key]
        while queue and now - queue[0] > self.window_seconds:
            queue.popleft()
        if len(queue) >= self.max_requests:
            return False
        queue.append(now)
        return True


rate_limiter = InMemoryRateLimiter(RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW_SECONDS)

app = FastAPI(title="musicdl webapi", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)
app.include_router(playback_router)
app.include_router(lyrics_router)

registry = TaskRegistry(
    max_tasks_per_user=int(os.getenv("MUSICDL_MAX_TASKS_PER_USER", "2")),
    max_tasks_global=int(os.getenv("MUSICDL_MAX_TASKS_GLOBAL", "4")),
    ttl_seconds=int(os.getenv("MUSICDL_TASK_TTL_SECONDS", str(24 * 3600))),
)


class MockDownloadRequest(BaseModel):
    subdir: str = Field(default="default")
    filename: str
    content: str = ""


@app.middleware("http")
async def timeout_middleware(request: Request, call_next):
    try:
        return await asyncio.wait_for(call_next(request), timeout=APP_TIMEOUT_SECONDS)
    except TimeoutError:
        return JSONResponse(status_code=504, content={"detail": "request timeout"})


@app.middleware("http")
async def body_limit_middleware(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_BODY_BYTES:
        return JSONResponse(status_code=413, content={"detail": "request body too large"})
    return await call_next(request)


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    if not rate_limiter.allow(client_ip):
        return JSONResponse(status_code=429, content={"detail": "rate limit exceeded"})
    return await call_next(request)


def sanitize_filename(name: str) -> str:
    cleaned = SAFE_FILE_CHARS.sub("_", name).strip("._-")
    if not cleaned:
        cleaned = "download"
    return cleaned[:128]


def _is_within_base(base: Path, candidate: Path) -> bool:
    try:
        candidate.relative_to(base)
        return True
    except ValueError:
        return False


def safe_download_path(subdir: str, filename: str) -> Path:
    base = DOWNLOAD_ROOT
    target_dir = (base / subdir).resolve()
    if not _is_within_base(base, target_dir):
        raise HTTPException(status_code=400, detail="invalid download directory")
    target_dir.mkdir(parents=True, exist_ok=True)
    safe_name = sanitize_filename(filename)
    candidate = (target_dir / safe_name).resolve()
    if not _is_within_base(base, candidate):
        raise HTTPException(status_code=400, detail="invalid download path")
    return candidate


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


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}


@app.get("/readyz")
async def readyz():
    DOWNLOAD_ROOT.mkdir(parents=True, exist_ok=True)
    writable = os.access(DOWNLOAD_ROOT, os.W_OK)
    return {"status": "ready" if writable else "not-ready", "download_root": str(DOWNLOAD_ROOT)}


@app.post("/api/downloads/mock")
async def create_mock_download(payload: MockDownloadRequest):
    out_path = safe_download_path(payload.subdir, payload.filename)
    out_path.write_text(payload.content, encoding="utf-8")
    return {"saved_to": str(out_path)}


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


if Path("ui/dist").exists():
    app.mount("/", StaticFiles(directory="ui/dist", html=True), name="ui")
