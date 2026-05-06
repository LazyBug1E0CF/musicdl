from __future__ import annotations

from collections.abc import Iterable
from typing import Any, Dict, List

from musicdl.musicdl import MusicClient
from musicdl.modules import MusicClientBuilder, SongInfo


class MusicService:
    @staticmethod
    def get_available_sources() -> List[str]:
        return sorted(MusicClientBuilder.REGISTERED_MODULES.keys())

    @staticmethod
    def _normalize_sources(sources: List[str] | str | None) -> List[str]:
        if not sources:
            return []
        if isinstance(sources, str):
            sources = [sources]
        return [s for s in sources if s in MusicClientBuilder.REGISTERED_MODULES]

    @staticmethod
    def _build_client(sources: List[str] | str | None, overrides: Dict[str, Any] | None) -> MusicClient:
        overrides = overrides or {}
        return MusicClient(
            music_sources=MusicService._normalize_sources(sources),
            init_music_clients_cfg=overrides.get('init_music_clients_cfg', {}),
            requests_overrides=overrides.get('requests_overrides', {}),
            clients_threadings=overrides.get('clients_threadings', {}),
            search_rules=overrides.get('search_rules', {}),
        )

    @staticmethod
    def _infer_sources_from_song_infos(
        song_infos: List[SongInfo] | List[dict] | Dict[str, List[SongInfo]] | None,
    ) -> List[str]:
        inferred_sources: set[str] = set()

        if isinstance(song_infos, dict):
            for source, songs in song_infos.items():
                if source in MusicClientBuilder.REGISTERED_MODULES:
                    inferred_sources.add(source)
                for song in songs or []:
                    song_source = song.source if isinstance(song, SongInfo) else song.get('source')
                    if song_source in MusicClientBuilder.REGISTERED_MODULES:
                        inferred_sources.add(song_source)
            return sorted(inferred_sources)

        if isinstance(song_infos, Iterable):
            for song in song_infos:
                song_source = song.source if isinstance(song, SongInfo) else (song.get('source') if isinstance(song, dict) else None)
                if song_source in MusicClientBuilder.REGISTERED_MODULES:
                    inferred_sources.add(song_source)

        return sorted(inferred_sources)

    @staticmethod
    def search(keyword: str, sources: List[str] | str | None = None, overrides: Dict[str, Any] | None = None) -> Dict[str, List[SongInfo]]:
        client = MusicService._build_client(sources, overrides)
        return client.search(keyword=keyword)

    @staticmethod
    def parse_playlist(playlist_url: str, sources: List[str] | str | None = None, overrides: Dict[str, Any] | None = None) -> List[SongInfo]:
        client = MusicService._build_client(sources, overrides)
        return client.parseplaylist(playlist_url=playlist_url)

    @staticmethod
    def download(song_infos: List[SongInfo] | List[dict] | Dict[str, List[SongInfo]], sources: List[str] | str | None = None, overrides: Dict[str, Any] | None = None) -> List[SongInfo]:
        download_sources = MusicService._normalize_sources(sources)
        if not download_sources:
            download_sources = MusicService._infer_sources_from_song_infos(song_infos)
        client = MusicService._build_client(download_sources, overrides)
        if isinstance(song_infos, dict):
            payload = song_infos
        elif isinstance(song_infos, Iterable):
            payload = [SongInfo.fromdict(s) if isinstance(s, dict) else s for s in song_infos]
        else:
            payload = []
        return client.download(song_infos=payload)
