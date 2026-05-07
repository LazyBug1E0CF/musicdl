from __future__ import annotations

import asyncio
import os
import shutil
import time
import uuid
from dataclasses import asdict, dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any


class TaskStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"


@dataclass
class TaskArtifact:
    relative_path: str
    filename: str
    size: int


@dataclass
class TaskState:
    task_id: str
    user_id: str
    status: TaskStatus = TaskStatus.PENDING
    total: int = 0
    completed: int = 0
    failed: int = 0
    logs: list[str] = field(default_factory=list)
    artifacts: list[TaskArtifact] = field(default_factory=list)
    result: Any | None = None
    error: Any | None = None
    created_at: float = field(default_factory=time.time)
    updated_at: float = field(default_factory=time.time)

    def to_dict(self) -> dict[str, Any]:
        data = asdict(self)
        data["status"] = self.status.value
        return data


class TaskRegistry:
    def __init__(self, max_tasks_per_user: int = 2, max_tasks_global: int = 4, ttl_seconds: int = 24 * 3600):
        self._tasks: dict[str, TaskState] = {}
        self._events: dict[str, asyncio.Condition] = {}
        self._lock = asyncio.Lock()
        self._max_tasks_per_user = max_tasks_per_user
        self._max_tasks_global = max_tasks_global
        self._ttl_seconds = ttl_seconds
        self._artifact_paths: dict[str, list[str]] = {}

    async def create_task(self, user_id: str, total: int = 0) -> TaskState:
        async with self._lock:
            self._cleanup_expired_locked()
            running_global = sum(1 for t in self._tasks.values() if t.status in {TaskStatus.PENDING, TaskStatus.RUNNING})
            running_user = sum(1 for t in self._tasks.values() if t.user_id == user_id and t.status in {TaskStatus.PENDING, TaskStatus.RUNNING})
            if running_global >= self._max_tasks_global:
                raise RuntimeError("too many running tasks globally")
            if running_user >= self._max_tasks_per_user:
                raise RuntimeError("too many running tasks for user")
            task_id = uuid.uuid4().hex
            task = TaskState(task_id=task_id, user_id=user_id, total=total)
            self._tasks[task_id] = task
            self._events[task_id] = asyncio.Condition()
            self._artifact_paths[task_id] = []
            return task

    async def get_task(self, task_id: str) -> TaskState | None:
        async with self._lock:
            self._cleanup_expired_locked()
            return self._tasks.get(task_id)

    async def update_task(self, task_id: str, **kwargs: Any) -> TaskState:
        async with self._lock:
            task = self._tasks[task_id]
            for k, v in kwargs.items():
                setattr(task, k, v)
            task.updated_at = time.time()
            event = self._events[task_id]
        async with event:
            event.notify_all()
        return task

    async def append_log(self, task_id: str, msg: str):
        async with self._lock:
            task = self._tasks[task_id]
            task.logs.append(msg)
            task.updated_at = time.time()
            event = self._events[task_id]
        async with event:
            event.notify_all()

    async def add_artifact(self, task_id: str, path: str, base_dir: str):
        p = Path(path).resolve()
        base = Path(base_dir).resolve()
        try:
            rel = str(p.relative_to(base))
        except ValueError:
            rel = str(p)
        artifact = TaskArtifact(relative_path=rel, filename=p.name, size=p.stat().st_size if p.exists() else 0)
        async with self._lock:
            task = self._tasks[task_id]
            task.artifacts.append(artifact)
            task.updated_at = time.time()
            self._artifact_paths.setdefault(task_id, []).append(str(p))
            event = self._events[task_id]
        async with event:
            event.notify_all()

    async def get_artifact_path(self, task_id: str, artifact_index: int) -> Path | None:
        async with self._lock:
            self._cleanup_expired_locked()
            paths = self._artifact_paths.get(task_id) or []
            if artifact_index < 0 or artifact_index >= len(paths):
                return None
            path = Path(paths[artifact_index]).resolve()
            return path if path.exists() and path.is_file() else None

    async def wait_for_change(self, task_id: str, timeout: float = 20.0):
        event = self._events[task_id]
        async with event:
            try:
                await asyncio.wait_for(event.wait(), timeout=timeout)
            except asyncio.TimeoutError:
                pass

    def _cleanup_expired_locked(self):
        now = time.time()
        expired = [tid for tid, t in self._tasks.items() if now - t.updated_at > self._ttl_seconds]
        for tid in expired:
            task = self._tasks.pop(tid)
            self._events.pop(tid, None)
            artifact_paths = self._artifact_paths.pop(tid, [])
            for art_path_str in artifact_paths:
                art_path = Path(art_path_str)
                try:
                    os.remove(art_path)
                except OSError:
                    pass
            # Best-effort cleanup of temp dirs produced by downloads.
            if task.artifacts:
                parents = {Path(p).parent for p in artifact_paths}
                if len(parents) == 1:
                    parent = next(iter(parents))
                    if parent.exists() and parent != Path(parent.anchor):
                        shutil.rmtree(parent, ignore_errors=True)
