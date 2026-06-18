# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

musicdl is a pure-Python music downloader supporting 40+ music platforms. This fork adds a web API (`webapi/`) and web UI (`webui/`) as user-facing web modules on top of the upstream core library (`musicdl/`).

## Architecture

```
musicdl/           # Core library (upstream)
├── musicdl.py     # Main MusicClient class: search, download, parseplaylist
├── modules/
│   ├── sources/   # 23 music platform clients (QQ, Netease, YouTube, Spotify, etc.)
│   │   ├── base.py          # BaseMusicClient abstract class
│   │   ├── __init__.py      # MusicClientBuilder with REGISTERED_MODULES registry
│   │   └── {platform}.py    # Per-platform implementations
│   ├── audiobooks/          # Audiobook platform clients
│   ├── common/              # Aggregator/multi-source gateways
│   ├── thirdpartysites/     # Unofficial download site scrapers
│   ├── utils/               # Shared utilities (SongInfo, crypto, download helpers, etc.)
│   ├── js/                  # JavaScript assets for platform integration (YouTube)
│   └── wvds/                # Widevine DRM-related files

webapi/            # FastAPI web API (fork-added)
├── app.py         # FastAPI app: routes, middleware, task management
├── api/v1/        # Route handlers
│   ├── playback.py  # POST /api/v1/playback/resolve
│   └── lyrics.py    # GET /api/v1/lyrics
├── services/
│   ├── music_service.py    # Bridges MusicClient to API (search, download, parse playlist)
│   └── playback_service.py # Resolves streaming URLs + lyrics
├── schemas/music.py        # Pydantic models
└── tasks/registry.py       # In-memory async task registry with SSE streaming

webui/             # React/TypeScript SPA (fork-added)
├── src/
│   ├── api/client.ts         # HTTP client for webapi
│   ├── store/useAppStore.ts  # Zustand state management
│   ├── pages/SearchPage.tsx  # Main search interface
│   ├── pages/SettingsPage.tsx# Settings (cookies, download mode, etc.)
│   ├── components/
│   │   ├── BottomPlayer.tsx  # Audio playback bar
│   │   ├── ResultList.tsx    # Search results table
│   │   ├── DownloadQueue.tsx # Download progress panel
│   │   ├── SourcePicker.tsx  # Multi-source selector
│   │   └── SourceBadge.tsx   # Source identifier badge
│   ├── types/index.ts        # TypeScript type definitions
│   ├── utils/                # Helpers (cookies, filenames, metadata, sources)
│   └── locales/              # i18n (en-US, zh-CN)
└── tests/resultMetadata.test.ts  # Unit tests

deploy/nginx/      # Production nginx config (API reverse proxy + static files)
```

## Key Design Patterns

- **Plugin-based music sources**: Each platform client extends `BaseMusicClient` and is registered in `MusicClientBuilder.REGISTERED_MODULES`. Adding a new source = create a class + register it.
- **MusicClient is the central orchestrator**: Instantiated with a list of source names; `search()`, `download()`, `parseplaylist()` run across all configured sources concurrently via `ThreadPoolExecutor`.
- **In-memory async task system**: `webapi/` uses `TaskRegistry` (in-memory dict) for tracking downloads with SSE streaming (`/api/v1/tasks/{id}/stream`). No database dependency.
- **State management**: WebUI uses Zustand store with localStorage persistence for settings and cookies.

## Development

### Core Library

```bash
pip install -e .
```

Runs as CLI: `musicdl -k "keyword"` or `python musicdl/musicdl.py` for interactive mode.

### Web API

```bash
pip install -r requirements.txt -r webapi/requirements.txt
pip install -e .
uvicorn webapi.app:app --reload --port 8000
```

The API serves the web UI static files from `ui/dist/` if available. Otherwise, it only provides the REST API.

### Web UI (standalone dev)

```bash
cd webui
npm install
npm run dev     # Vite dev server, proxies /api to localhost:8000
npm run build   # TypeScript check + production build
npm test        # Run unit tests (node test runner)
```

### Docker

```bash
docker compose up --build   # api on :8000, ui on :18008
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/healthz` | Health check |
| GET | `/readyz` | Readiness (writable download dir) |
| GET | `/api/v1/sources` | List available music sources |
| POST | `/api/v1/search` | Search music by keyword |
| POST | `/api/v1/playlist/parse` | Parse playlist URL |
| POST | `/api/v1/download` | Start download task (async) |
| GET | `/api/v1/tasks/{id}` | Get task status |
| GET | `/api/v1/tasks/{id}/stream` | SSE task updates |
| GET | `/api/v1/tasks/{id}/artifacts/{idx}` | Download file artifact |
| POST | `/api/v1/playback/resolve` | Resolve streaming URL |
| GET | `/api/v1/lyrics` | Get lyrics |

## Model Strategy

- **分析、规划、架构设计、任务拆分、审核验收** → 使用当前对话模型（我在 Plan / Explore 模式下处理）
- **具体编码实现** → 将任务拆出，launch Agent with `subagent_type="general-purpose", model="sonnet"` 或更便宜的模型执行
- **代码探索、搜索** → launch Agent with `subagent_type="Explore"` 进行只读代码库调研

## Key Config Conventions

- `APIConfig` (pydantic) structures per-source overrides:
  - `init_music_clients_cfg`: per-source config (cookies, work_dir, search_size)
  - `requests_overrides`: per-source headers/proxies
  - `clients_threadings`: per-source thread counts
  - `search_rules`: per-source search type/paging
- Source aliases (`music_service.py:SOURCE_ALIASES`) allow short names like `"netease"` → `"NeteaseMusicClient"`
- Cookie config per source via `MUSICDL_{SOURCE}_COOKIE` env var (playback) or web UI settings
