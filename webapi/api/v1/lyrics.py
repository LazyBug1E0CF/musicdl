from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from webapi.services.playback_service import PlaybackError, get_lyrics

router = APIRouter(prefix="/api/v1", tags=["lyrics"])


@router.get('/lyrics')
def lyrics(
    source: str = Query(...),
    song_id: Optional[str] = Query(None),
    url: Optional[str] = Query(None),
    song_name: Optional[str] = Query(None),
    singers: Optional[str] = Query(None),
):
    try:
        return get_lyrics(source=source, song_id=song_id, song_url=url, song_name=song_name, singers=singers)
    except PlaybackError as exc:
        raise HTTPException(status_code=404, detail={"code": exc.code, "message": exc.message}) from exc
