from __future__ import annotations

from typing import Any, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from webapi.services.playback_service import PLAYBACK_NOT_SUPPORTED, PlaybackError, resolve_playback

router = APIRouter(prefix="/api/v1/playback", tags=["playback"])


class ResolvePlaybackRequest(BaseModel):
    source: str = Field(..., description="music source, e.g. netease / qq / kuwo")
    song_info: Optional[dict[str, Any]] = None
    song_id: Optional[str] = None
    url: Optional[str] = None
    include_lyric: bool = False


class ResolvePlaybackResponse(BaseModel):
    stream_url: str
    mime_type: str
    expires_at: str
    lyric: Optional[str] = None


@router.post("/resolve", response_model=ResolvePlaybackResponse)
def resolve(req: ResolvePlaybackRequest):
    try:
        return resolve_playback(
            source=req.source,
            song_id=req.song_id,
            song_url=req.url,
            song_info=req.song_info,
            include_lyric=req.include_lyric,
        )
    except PlaybackError as exc:
        status = 422 if exc.code == PLAYBACK_NOT_SUPPORTED else 400
        raise HTTPException(status_code=status, detail={"code": exc.code, "message": exc.message}) from exc
