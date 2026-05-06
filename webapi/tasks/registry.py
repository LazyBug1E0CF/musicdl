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
    error: str | None = None
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
        task = await self.update_task(task_id)
        task.logs.append(msg)

    async def add_artifact(self, task_id: str, path: str, base_dir: str):
        p = Path(path)
        rel = str(p.relative_to(base_dir)) if str(p).startswith(str(base_dir)) else p.name
        artifact = TaskArtifact(relative_path=rel, filename=p.name, size=p.stat().st_size if p.exists() else 0)
        task = await self.update_task(task_id)
        task.artifacts.append(artifact)

    async def wait_for_change(self, task_id: str, timeout: float = 20.0):
        event = self._events[task_id]
        async with event:
            try:
                await asyncio.wait_for(event.wait(), timeout=timeout)
            except TimeoutError:
                pass

    def _cleanup_expired_locked(self):
        now = time.time()
        expired = [tid for tid, t in self._tasks.items() if now - t.updated_at > self._ttl_seconds]
        for tid in expired:
            task = self._tasks.pop(tid)
            self._events.pop(tid, None)
            for art in task.artifacts:
                try:
                    os.remove(art.relative_path)
                except OSError:
                    pass
            # Best-effort cleanup of temp dirs produced by downloads.
            if task.artifacts:
                parent = Path(task.artifacts[0].relative_path).parent
                if parent and parent != Path('.'):
                    shutil.rmtree(parent, ignore_errors=True)
