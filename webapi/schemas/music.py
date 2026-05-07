from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class ApiError(BaseModel):
    code: str
    message: str
    source: Optional[str] = None
    detail: Optional[Any] = None


class APIConfig(BaseModel):
    init_music_clients_cfg: Dict[str, Dict[str, Any]] = Field(default_factory=dict)
    requests_overrides: Dict[str, Dict[str, Any]] = Field(default_factory=dict)
    clients_threadings: Dict[str, int] = Field(default_factory=dict)
    search_rules: Dict[str, Dict[str, Any]] = Field(default_factory=dict)


class SongInfoSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True, coerce_numbers_to_str=True)

    raw_data: Dict[str, Any] = Field(default_factory=dict)
    song_name: Optional[str] = None
    singers: Optional[str] = None
    source: Optional[str] = None
    root_source: Optional[str] = None
    album: Optional[str] = None
    ext: Optional[str] = None
    duration: Optional[str] = None
    duration_s: Optional[float] = None
    file_size: Optional[str] = None
    file_size_bytes: Optional[int] = None
    bitrate: Optional[int] = None
    codec: Optional[str] = None
    samplerate: Optional[int] = None
    channels: Optional[int] = None
    lyric: Optional[str] = None
    cover_url: Optional[str] = None
    download_url: Optional[Any] = None
    download_url_status: Dict[str, Any] = Field(default_factory=dict)
    default_download_headers: Dict[str, Any] = Field(default_factory=dict)
    default_download_cookies: Dict[str, Any] = Field(default_factory=dict)
    protocol: Optional[str] = None
    work_dir: Optional[str] = None
    identifier: Optional[str] = None
    save_path: Optional[str] = Field(default=None, alias='path')
    episodes: Optional[List['SongInfoSchema']] = None


class SearchRequest(BaseModel):
    keyword: str
    sources: List[str] = Field(default_factory=list)
    overrides: APIConfig = Field(default_factory=APIConfig)


class ParsePlaylistRequest(BaseModel):
    playlist_url: str
    sources: List[str] = Field(default_factory=list)
    overrides: APIConfig = Field(default_factory=APIConfig)


class DownloadRequest(BaseModel):
    song_infos: List[SongInfoSchema] = Field(default_factory=list)
    sources: List[str] = Field(default_factory=list)
    overrides: APIConfig = Field(default_factory=APIConfig)
    filename_format: Literal["artist-title", "title-artist"] = "artist-title"


class TaskResponse(BaseModel):
    task_id: str
    status: str
    result: Optional[Any] = None
    error: Optional[ApiError] = None


SongInfoSchema.model_rebuild()
