# Project Capabilities

This note summarizes the non-`webui/` and non-`webapi/` code in this repository for future agents and maintainers.

## High-Level Purpose

`musicdl` is a Python music/audio search and download toolkit. The core library can search many music, audiobook, podcast, radio, aggregator, and scraper sources; normalize results into `SongInfo`; let users select results in a terminal table; download HTTP or HLS audio; save search/download metadata; and enrich downloaded files with lyrics, tags, cover art, codec metadata, and size/duration information.

The packaged CLI entry point is `musicdl = musicdl.musicdl:MusicClientCMD`.

## Core Runtime

- `musicdl/musicdl.py`: defines `MusicClient` and the Click CLI. `MusicClient` builds one or more source clients, searches sources concurrently, displays selectable terminal result tables, groups selected tracks by source, downloads them, and can try each configured source's `parseplaylist()` until one succeeds.
- `musicdl/modules/sources/base.py`: defines `BaseMusicClient`, the common adapter contract. Subclasses implement `_constructsearchurls()`, `_search()`, and optionally `parseplaylist()` or custom `_download()`. The base class handles work directory creation, retrying HTTP sessions, optional proxy acquisition, random user agents, `curl_cffi` impersonation, concurrent per-source search/download, HLS dispatch, direct HTTP streaming, progress display, duplicate removal, and pickle result persistence.
- `musicdl/modules/sources/__init__.py`: registers all source clients through `MusicClientBuilder`, making the source class name the public selector used by the CLI/API.
- `musicdl/modules/utils/data.py`: defines the `SongInfo` dataclass used across the project. It carries raw source data, source/root source, title/artist/album, lyric, cover, audio properties, download URL/status, episodes, protocol, cookies/headers, work dir, save path, and serialization helpers.

## Source Modules

Registered clients are grouped by implementation directory:

- Main music platforms: `QQMusicClient`, `KugouMusicClient`, `KuwoMusicClient`, `MiguMusicClient`, `NeteaseMusicClient`, `QianqianMusicClient`, `BilibiliMusicClient`, `FiveSingMusicClient`, `SodaMusicClient`, `StreetVoiceMusicClient`.
- Global or indie platforms: `AppleMusicClient`, `DeezerMusicClient`, `FMAMusicClient`, `JamendoMusicClient`, `JioSaavnMusicClient`, `JooxMusicClient`, `QobuzMusicClient`, `SoundCloudMusicClient`, `SpotifyMusicClient`, `TIDALMusicClient`, `YouTubeMusicClient`.
- Audio/radio/audiobook sources: `XimalayaMusicClient`, `LizhiMusicClient`, `QingtingMusicClient`, `LRTSMusicClient`, `ITunesMusicClient`.
- Aggregators and gateways: `GDStudioMusicClient`, `TuneHubMusicClient`, `MP3JuiceMusicClient`, `MyFreeMP3MusicClient`, `JBSouMusicClient`.
- Unofficial scraper/download-site sources: `MituMusicClient`, `BuguyyMusicClient`, `GequbaoMusicClient`, `YinyuedaoMusicClient`, `FLMP3MusicClient`, `FangpiMusicClient`, `FiveSongMusicClient`, `KKWSMusicClient`, `GequhaiMusicClient`, `LivePOOMusicClient`, `HTQYYMusicClient`, `JCPOOMusicClient`, `TwoT58MusicClient`, `ZhuolinMusicClient`.

Most source modules follow the same shape: build one or more search URLs, call official or third-party endpoints, parse candidate quality variants, test candidate audio URLs with `AudioLinkTester`, choose valid/larger/lossless results when available, convert lyrics to LRC/plain text as needed, and return `SongInfo`. Many support playlist parsing for platform album/playlist URLs. Audiobook/radio clients may return a parent `SongInfo` with `episodes` for track/channel/album entries.

Netease and QQ search adapters honor caller-provided pagination rules in `search_rules`: NetEase applies `offset` as the base offset for generated search pages, and QQ applies `page_num` as the base page number. Web/API callers can use these rules for incremental result loading without changing the core `MusicClient.search()` contract.

## Download, Audio, Lyrics, And Metadata

- `AudioLinkTester` in `utils/misc.py` validates candidate links by HEAD/GET, follows redirects, checks status and content length, infers audio extensions from URL, content type, content disposition, sampled bytes, `filetype`, and `puremagic`, and can losslessly extract audio from video containers through `ffmpeg`.
- `HLSDownloader` in `utils/hls.py` downloads M3U8 streams. It resolves master playlists, selects variants, builds segment plans, supports byte ranges/init maps, handles AES-128/CBC/CTR-style segment decryption where supported, downloads segments concurrently with retries, merges them, and optionally remuxes with `ffmpeg`.
- `SongInfoUtils` in `utils/songinfoutils.py` updates file size, duration, bitrate, sample rate, channels, and codec using `TinyTag`; saves `.lrc`; embeds lyrics, title, album, artist, and cover art into MP3, MP4/M4A, FLAC, OGG/OPUS, ASF/WMA when supported by `mutagen`; and can generate missing lyrics from local audio with `WhisperLRC` when enabled.
- `utils/lyric.py` cleans LRC text, extracts duration from time tags, searches online lyric APIs including lrclib/lyrics.ovh/Happi/Musixmatch, and optionally transcribes audio to LRC with `faster-whisper`.
- `utils/cmd.py` builds external command argument lists for `ffmpeg`, `ffprobe`, `metaflac`, `N_m3u8DL-RE`, `MP4Box`, `mp4decrypt`, and `amdecrypt`, with a small modification system for callers that need to alter command flags.

## Platform-Specific Helpers

- `appleutils.py`: Apple Music API/session helpers, storefront and media metadata models, lyrics/cover/tag helpers, web playback/license calls, HLS/DRM metadata parsing, decryption key handling, `N_m3u8DL-RE` downloads, `mp4decrypt`/`amdecrypt`/`ffmpeg`/`MP4Box` staging, and final download item assembly.
- `tidalutils.py`: TIDAL session storage/auth/refresh, track/album/playlist/search models, DASH manifest parsing, encrypted stream token decryption, FLAC/remux handling via `ffmpeg` or PyAV, lyrics and media metadata helpers.
- `youtubeutils.py` plus `modules/js/youtube/`: YouTube InnerTube requests, stream/query models, JS signature and `n` parameter handling, PO token/Botguard support, protobuf-like SABR request/response parsing, stream downloading, and Node/JS support files.
- `qqutils.py`, `kugouutils.py`, `kuwoutils.py`, `neteaseutils.py`, `qobuzutils.py`, `sodautils.py`, `spotifyutils.py`, `deezerutils.py`, and `soundcloudutils.py`: platform-specific signing, encryption/decryption, token/session, playlist, lyric, and media URL helpers.
- `quarkparser.py` and `lanzouyparser.py`: parse Quark cloud and LanZouY share links into direct download URLs, used by several third-party site scrapers.
- `cookies.py`, `hosts.py`, `ip.py`, `importutils.py`, `logger.py`, `modulebuilder.py`, and general `misc.py`: shared cookie conversion/cache, hostname matching, random IP generation, optional imports, rich/PrettyTable formatting, plugin builder, string/path sanitation, JSON repair, response validation, and small collection utilities.

## Non-Web Entry Points And Examples

- `mcp/server_local.py`: a small stdio MCP server exposing `search` and `download` tools backed by `MusicClient`.
- `scripts/build_cookies_for_*.py`: helper scripts for acquiring cookies/session data for JOOX, Kugou, Qingting FM, Qobuz, and TIDAL. Some are QR-code or username/password based and require user-provided credentials.
- `scripts/clean_pkg_cache.py`: removes `__pycache__` directories.
- `examples/musicdlgui/`: a legacy PyQt GUI example that uses the core `MusicClient` directly.
- `examples/searchlyrics/`: searches by lyric text, downloads the first NetEase result, cuts the matching lyric segment with `pydub`, and plays/exports it.
- `examples/singerlyricsanalysis/`: searches many Migu songs for a singer, then builds word-cloud, frequency, and sentiment-analysis outputs from lyrics.

## Packaging And Dependencies

`setup.py` packages `musicdl`, includes Widevine device files and YouTube JS assets, and installs the console script. Core dependencies cover HTTP, HTML parsing, JSON repair, crypto, progress/table rendering, audio metadata/tagging, HLS parsing, Widevine, YouTube Music, Node support, and optional web-server dependencies. Optional requirements add Whisper transcription and image/proxy support.

## Maintenance Notes

- Source adapters are intentionally heterogeneous because each platform has different endpoint, signing, cookie, playlist, and audio-link behavior. Prefer existing source-specific helper modules before adding new cross-source abstractions.
- Preserve the `SongInfo` contract when adding or changing sources; downstream download, tagging, lyrics, result persistence, CLI selection, and MCP examples assume that shape.
- When changing download, HLS, lyrics, tag writing, command construction, cloud-share parsing, or source registration behavior, update this file if the project capability surface changes.
