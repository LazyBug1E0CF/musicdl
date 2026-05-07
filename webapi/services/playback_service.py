from __future__ import annotations

import os
from datetime import datetime, timezone, timedelta
from typing import Any, Optional
from urllib.parse import parse_qs, urlparse


from musicdl.modules import BuildMusicClient, LyricSearchClient, SongInfo, cleanlrc

PLAYBACK_NOT_SUPPORTED = "PLAYBACK_NOT_SUPPORTED"
SOURCE_ALIASES = {
    "qq": "QQMusicClient",
    "netease": "NeteaseMusicClient",
    "migu": "MiguMusicClient",
    "kuwo": "KuwoMusicClient",
    "qianqian": "QianqianMusicClient",
    "youtube": "YouTubeMusicClient",
    "spotify": "SpotifyMusicClient",
    "deezer": "DeezerMusicClient",
    "tidal": "TIDALMusicClient",
    "soundcloud": "SoundCloudMusicClient",
}


class PlaybackError(RuntimeError):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


def _extract_song_id(song_id: Optional[str], song_url: Optional[str]) -> Optional[str]:
    if song_id:
        return song_id
    if not song_url:
        return None
    parsed = urlparse(song_url)
    query = parse_qs(parsed.query)
    return (query.get("id", [None])[0] or parsed.path.rstrip("/").split("/")[-1])


def _extract_mime_type(download_url: str, ext: Optional[str]) -> str:
    if ext:
        ext = str(ext).lower().removeprefix(".")
        return {
            "mp3": "audio/mpeg",
            "m4a": "audio/mp4",
            "flac": "audio/flac",
            "wav": "audio/wav",
            "ogg": "audio/ogg",
        }.get(ext, "application/octet-stream")
    lower = download_url.lower()
    if ".m3u8" in lower:
        return "application/vnd.apple.mpegurl"
    if ".mp3" in lower:
        return "audio/mpeg"
    return "application/octet-stream"


def normalize_song(song: SongInfo) -> dict[str, Any]:
    return {
        "source": song.source,
        "root_source": song.root_source,
        "song_id": song.identifier,
        "song_name": song.song_name,
        "singers": song.singers,
        "album": song.album,
        "duration": song.duration,
        "stream_url": song.download_url,
        "mime_type": _extract_mime_type(str(song.download_url or ""), song.ext),
        "available": bool(song.with_valid_download_url),
        "protocol": song.protocol,
    }


def _build_request_overrides(source: str) -> dict[str, Any]:
    prefix = f"MUSICDL_{str(source).upper()}_"
    cookie = os.getenv(prefix + "COOKIE")
    auth = os.getenv(prefix + "AUTHORIZATION")
    headers = {}
    if auth:
        headers["Authorization"] = auth
    return {"cookies": {"cookie": cookie} if cookie else {}, "headers": headers}


def _merge_request_overrides(source: str, overrides: Optional[dict[str, Any]] = None) -> dict[str, Any]:
    merged = _build_request_overrides(source)
    source_overrides = ((overrides or {}).get("requests_overrides") or {}).get(source) or {}
    for key, value in source_overrides.items():
        if key in {"headers", "cookies"} and isinstance(value, dict):
            merged[key] = {**(merged.get(key) or {}), **value}
        else:
            merged[key] = value
    return merged


def resolve_playback(
    source: str,
    song_id: Optional[str] = None,
    song_url: Optional[str] = None,
    song_info: Optional[dict[str, Any]] = None,
    include_lyric: bool = False,
    overrides: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    source = SOURCE_ALIASES.get(str(source).strip().lower(), source)
    sid = _extract_song_id(song_id, song_url)
    module_cfg = {"type": source}
    module_cfg.update(((overrides or {}).get("init_music_clients_cfg") or {}).get(source) or {})
    client = BuildMusicClient(module_cfg=module_cfg)

    def _playback_payload(song: SongInfo) -> dict[str, Any]:
        if not song.with_valid_download_url or not isinstance(song.download_url, str):
            raise PlaybackError(PLAYBACK_NOT_SUPPORTED, f"source={source} does not provide direct stream url")
        payload = {
            "stream_url": song.download_url,
            "mime_type": _extract_mime_type(song.download_url, song.ext),
            "expires_at": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
        }
        if include_lyric:
            lyric = song.lyric
            if not lyric and song.song_name and song.singers:
                _, lyric = LyricSearchClient.search(track_name=song.song_name, artist_name=song.singers)
            if lyric and lyric not in {"NULL", "None", "none"}:
                payload["lyric"] = cleanlrc(lyric)
        return payload

    def _resolve_from_identifier() -> Optional[SongInfo]:
        if not sid:
            return None
        resolved_candidates = client.search(keyword=sid, num_threadings=1, request_overrides=_merge_request_overrides(source, overrides))
        for candidate in resolved_candidates:
            if str(getattr(candidate, "identifier", "")) == str(sid):
                return candidate
        return resolved_candidates[0] if resolved_candidates else None

    if song_info:
        song = SongInfo.fromdict(song_info)
        if not song.source:
            song.source = source
        if not song.identifier:
            song.identifier = sid
        if (not song.with_valid_download_url) or (song.ext is None):
            resolved_song = _resolve_from_identifier()
            if resolved_song is not None:
                song = resolved_song
    else:
        song = _resolve_from_identifier() or SongInfo(source=source, identifier=sid)
    return _playback_payload(song)


def get_lyrics(source: str, song_id: Optional[str] = None, song_url: Optional[str] = None, song_name: Optional[str] = None, singers: Optional[str] = None) -> dict[str, Any]:
    if song_name and singers:
        _, lyric = LyricSearchClient.search(track_name=song_name, artist_name=singers)
        if lyric and lyric not in {"NULL", "None", "none"}:
            return {"lyric": cleanlrc(lyric), "source": source}

    resolved = resolve_playback(source=source, song_id=song_id, song_url=song_url, include_lyric=True)
    if "lyric" not in resolved:
        raise PlaybackError("LYRIC_NOT_FOUND", "lyric not available")
    return {"lyric": resolved["lyric"], "source": source}
