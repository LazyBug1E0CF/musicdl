import asyncio
import os
import re
import time
from collections import defaultdict, deque
from pathlib import Path
from typing import Deque

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

APP_TIMEOUT_SECONDS = float(os.getenv("APP_TIMEOUT_SECONDS", "30"))
MAX_BODY_BYTES = int(os.getenv("MAX_BODY_BYTES", str(2 * 1024 * 1024)))
RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "60"))
RATE_LIMIT_WINDOW_SECONDS = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))
DOWNLOAD_ROOT = Path(os.getenv("DOWNLOAD_ROOT", "./downloads")).resolve()
CORS_ALLOW_ORIGINS = [x.strip() for x in os.getenv("CORS_ALLOW_ORIGINS", "http://localhost:5173,http://localhost:8080").split(",") if x.strip()]


class InMemoryRateLimiter:
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.buckets: dict[str, Deque[float]] = defaultdict(deque)

    def allow(self, key: str) -> bool:
        now = time.time()
        q = self.buckets[key]
        while q and now - q[0] > self.window_seconds:
            q.popleft()
        if len(q) >= self.max_requests:
            return False
        q.append(now)
        return True


rate_limiter = InMemoryRateLimiter(RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW_SECONDS)

app = FastAPI(title="musicdl Web API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


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


SAFE_FILE_CHARS = re.compile(r"[^a-zA-Z0-9._-]+")


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


class DownloadRequest(BaseModel):
    subdir: str = Field(default="default")
    filename: str
    content: str = ""


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}


@app.get("/readyz")
async def readyz():
    DOWNLOAD_ROOT.mkdir(parents=True, exist_ok=True)
    writable = os.access(DOWNLOAD_ROOT, os.W_OK)
    return {"status": "ready" if writable else "not-ready", "download_root": str(DOWNLOAD_ROOT)}


@app.post("/api/downloads/mock")
async def create_mock_download(payload: DownloadRequest):
    out_path = safe_download_path(payload.subdir, payload.filename)
    out_path.write_text(payload.content, encoding="utf-8")
    return {"saved_to": str(out_path)}


if Path("ui/dist").exists():
    app.mount("/", StaticFiles(directory="ui/dist", html=True), name="ui")
