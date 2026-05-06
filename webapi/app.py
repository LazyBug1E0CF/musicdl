from __future__ import annotations

import asyncio
import os
from pathlib import Path
from typing import Any

from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from musicdl.musicdl import MusicDL
from webapi.tasks.registry import TaskRegistry, TaskStatus


app = FastAPI(title="musicdl webapi")
registry = TaskRegistry(
    max_tasks_per_user=int(os.getenv("MUSICDL_MAX_TASKS_PER_USER", "2")),
    max_tasks_global=int(os.getenv("MUSICDL_MAX_TASKS_GLOBAL", "4")),
    ttl_seconds=int(os.getenv("MUSICDL_TASK_TTL_SECONDS", str(24 * 3600))),
)


class DownloadRequest(BaseModel):
    keyword: str | None = None
    playlist_url: str | None = None
    music_sources: list[str] = Field(default_factory=lambda: ["qq", "netease"])
    search_size_per_source: int = 3
    work_dir: str = "./downloads"


async def _run_download(task_id: str, payload: DownloadRequest):
    await registry.update_task(task_id, status=TaskStatus.RUNNING)
    try:
        music_client = MusicDL(music_sources=payload.music_sources)
        song_infos = await asyncio.to_thread(
            music_client.search,
            keyword=payload.keyword,
            playlist_url=payload.playlist_url,
            search_size_per_source=payload.search_size_per_source,
        )
        await registry.update_task(task_id, total=len(song_infos))
        for idx, song in enumerate(song_infos, start=1):
            try:
                await asyncio.to_thread(music_client.download, [song], work_dir=payload.work_dir)
                save_path = getattr(song, "save_path", None)
                if save_path and Path(save_path).exists():
                    await registry.add_artifact(task_id, save_path, payload.work_dir)
                await registry.append_log(task_id, f"[{idx}/{len(song_infos)}] done: {getattr(song, 'name', 'unknown')}")
            except Exception as exc:
                await registry.update_task(task_id, failed=(await registry.get_task(task_id)).failed + 1)
                await registry.append_log(task_id, f"[{idx}/{len(song_infos)}] failed: {exc}")
            finally:
                t = await registry.get_task(task_id)
                await registry.update_task(task_id, completed=t.completed + 1)
        t = await registry.get_task(task_id)
        final_status = TaskStatus.SUCCESS if t.failed == 0 else TaskStatus.FAILED
        await registry.update_task(task_id, status=final_status)
    except Exception as exc:
        await registry.update_task(task_id, status=TaskStatus.FAILED, error=str(exc))


@app.post("/api/v1/download")
async def create_download_task(payload: DownloadRequest, x_user_id: str | None = Header(default="anonymous")):
    try:
        task = await registry.create_task(user_id=x_user_id or "anonymous")
    except RuntimeError as exc:
        raise HTTPException(status_code=429, detail=str(exc)) from exc
    asyncio.create_task(_run_download(task.task_id, payload))
    return {"task_id": task.task_id, "status": task.status.value}


@app.get("/api/v1/tasks/{task_id}")
async def get_task(task_id: str):
    task = await registry.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="task not found")
    return task.to_dict()


@app.get("/api/v1/tasks/{task_id}/stream")
async def stream_task(task_id: str):
    if not await registry.get_task(task_id):
        raise HTTPException(status_code=404, detail="task not found")

    async def gen():
        while True:
            task = await registry.get_task(task_id)
            if not task:
                break
            yield f"data: {task.to_dict()}\n\n"
            if task.status in {TaskStatus.SUCCESS, TaskStatus.FAILED}:
                break
            await registry.wait_for_change(task_id)

    return StreamingResponse(gen(), media_type="text/event-stream")
