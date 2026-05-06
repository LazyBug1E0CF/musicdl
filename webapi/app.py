from __future__ import annotations

import traceback
import uuid
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Dict

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from webapi.schemas.music import (
    ApiError,
    DownloadRequest,
    ParsePlaylistRequest,
    SearchRequest,
    SongInfoSchema,
    TaskResponse,
)
from webapi.services.music_service import MusicService

app = FastAPI(title='musicdl webapi', version='1.0.0')
_executor = ThreadPoolExecutor(max_workers=8)
_tasks: Dict[str, Dict[str, Any]] = {}


def _song_to_schema(song_info):
    song_dict = song_info.todict()
    song_dict['path'] = song_info.save_path
    return SongInfoSchema.model_validate(song_dict).model_dump(by_alias=False)


def _error(code: str, message: str, source: str | None = None, detail: Any = None):
    return {'error': ApiError(code=code, message=message, source=source, detail=detail).model_dump()}


@app.exception_handler(HTTPException)
async def http_exception_handler(_, exc: HTTPException):
    detail = exc.detail if isinstance(exc.detail, dict) else {'message': str(exc.detail)}
    err = ApiError(
        code=detail.get('code', f'HTTP_{exc.status_code}'),
        message=detail.get('message', 'request failed'),
        source=detail.get('source'),
        detail=detail.get('detail'),
    )
    return JSONResponse(status_code=exc.status_code, content={'error': err.model_dump()})


@app.exception_handler(Exception)
async def exception_handler(_, exc: Exception):
    err = ApiError(code='INTERNAL_ERROR', message='internal server error', detail=str(exc))
    return JSONResponse(status_code=500, content={'error': err.model_dump()})


@app.get('/api/v1/sources')
def get_sources():
    return {'sources': MusicService.get_available_sources()}


@app.post('/api/v1/search')
def search(payload: SearchRequest):
    try:
        results = MusicService.search(payload.keyword, payload.sources, payload.overrides.model_dump())
        return {'results': {source: [_song_to_schema(s) for s in songs] for source, songs in results.items()}}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=_error('SEARCH_FAILED', 'search failed', detail=str(exc))['error']) from exc


@app.post('/api/v1/playlist/parse')
def parse_playlist(payload: ParsePlaylistRequest):
    try:
        songs = MusicService.parse_playlist(payload.playlist_url, payload.sources, payload.overrides.model_dump())
        return {'songs': [_song_to_schema(s) for s in songs]}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=_error('PLAYLIST_PARSE_FAILED', 'playlist parse failed', detail=str(exc))['error']) from exc


@app.post('/api/v1/download', response_model=TaskResponse)
def download(payload: DownloadRequest):
    task_id = str(uuid.uuid4())
    _tasks[task_id] = {'task_id': task_id, 'status': 'queued', 'result': None, 'error': None}

    def _run_task():
        _tasks[task_id]['status'] = 'running'
        try:
            songs = [s.model_dump() for s in payload.song_infos]
            result = MusicService.download(songs, payload.sources, payload.overrides.model_dump())
            _tasks[task_id]['status'] = 'succeeded'
            _tasks[task_id]['result'] = [_song_to_schema(s) for s in result]
        except Exception as exc:
            _tasks[task_id]['status'] = 'failed'
            _tasks[task_id]['error'] = ApiError(
                code='DOWNLOAD_FAILED',
                message='download failed',
                detail={'error': str(exc), 'traceback': traceback.format_exc()},
            ).model_dump()

    _executor.submit(_run_task)
    return TaskResponse(task_id=task_id, status='queued')


@app.get('/api/v1/tasks/{task_id}', response_model=TaskResponse)
def get_task(task_id: str):
    task = _tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail=_error('TASK_NOT_FOUND', 'task not found', detail={'task_id': task_id})['error'])
    return TaskResponse(**task)
