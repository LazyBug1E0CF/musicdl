from __future__ import annotations

from collections.abc import Iterable
from typing import Any, Dict, List

from musicdl.musicdl import MusicClient
from musicdl.modules import MusicClientBuilder, SongInfo

from webapi.services.search_category import translate_search_category


class MusicService:
    SOURCE_ALIASES = {
        'qq': 'QQMusicClient',
        'kugou': 'KugouMusicClient',
        'streetvoice': 'StreetVoiceMusicClient',
        'soda': 'SodaMusicClient',
        'fivesing': 'FiveSingMusicClient',
        'netease': 'NeteaseMusicClient',
        'qianqian': 'QianqianMusicClient',
        'migu': 'MiguMusicClient',
        'kuwo': 'KuwoMusicClient',
        'bilibili': 'BilibiliMusicClient',
        'youtube': 'YouTubeMusicClient',
        'joox': 'JooxMusicClient',
        'apple': 'AppleMusicClient',
        'jamendo': 'JamendoMusicClient',
        'soundcloud': 'SoundCloudMusicClient',
        'deezer': 'DeezerMusicClient',
        'qobuz': 'QobuzMusicClient',
        'spotify': 'SpotifyMusicClient',
        'tidal': 'TIDALMusicClient',
        'fma': 'FMAMusicClient',
        'jiosaavn': 'JioSaavnMusicClient',
        'ximalaya': 'XimalayaMusicClient',
        'lizhi': 'LizhiMusicClient',
        'qingting': 'QingtingMusicClient',
        'lrts': 'LRTSMusicClient',
        'itunes': 'ITunesMusicClient',
        'mp3juice': 'MP3JuiceMusicClient',
        'tunehub': 'TuneHubMusicClient',
        'gdstudio': 'GDStudioMusicClient',
        'myfreemp3': 'MyFreeMP3MusicClient',
        'jbsou': 'JBSouMusicClient',
    }

    @staticmethod
    def get_available_sources() -> List[str]:
        return sorted(MusicClientBuilder.REGISTERED_MODULES.keys())

    @staticmethod
    def _normalize_sources(sources: List[str] | str | None) -> List[str]:
        if not sources:
            return []
        if isinstance(sources, str):
            sources = [sources]
        normalized = []
        for source in sources:
            canonical = MusicService.SOURCE_ALIASES.get(str(source).strip().lower(), source)
            if canonical in MusicClientBuilder.REGISTERED_MODULES:
                normalized.append(canonical)
        return normalized

    @staticmethod
    def _category_search_rules(category: str, sources: list[str]) -> dict[str, dict[str, Any]]:
        return translate_search_category(category, sources)

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
    def search(keyword: str, sources: List[str] | str | None = None, overrides: Dict[str, Any] | None = None, category: str = "song") -> Dict[str, List[SongInfo]]:
        normalized = MusicService._normalize_sources(sources)
        category_rules = MusicService._category_search_rules(category, normalized)
        merged_overrides = dict(overrides or {})
        merged_overrides["search_rules"] = {
            source: {**category_rules.get(source, {}), **(merged_overrides.get("search_rules") or {}).get(source, {})}
            for source in (normalized or [])
        }
        client = MusicService._build_client(sources, merged_overrides)
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
