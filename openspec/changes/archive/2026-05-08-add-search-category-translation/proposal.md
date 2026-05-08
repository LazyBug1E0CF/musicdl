## Why

The WebUI currently hardcodes platform-specific search parameters (`type: 1` for Netease songs, `search_type: 0` for QQ songs, etc.) in the frontend client. Adding or updating category support for any music source requires frontend code changes. Moving this translation to the API layer keeps the WebUI generic and makes the category mapping the single source of truth that the backend owns.

## What Changes

- Add `webapi/services/search_category.py` — a translation module that defines a neutral `SearchCategory` enum (`song`, `album`, `artist`) and maps each to per-source search parameters
- Update `MusicService.search()` to accept a `category` parameter and use the translation module to produce source-specific `search_rules`
- Update WebUI `client.ts` to send `category` as a string instead of building `CATEGORY_SEARCH_RULES` with platform-specific parameters
- Remove `CATEGORY_SEARCH_RULES` constant from `webui/src/api/client.ts`
- Existing `POST /api/v1/search` request schema gains an optional `category` field

## Capabilities

### New Capabilities

- `search-category-translation`: A backend translation layer that maps neutral search categories (`song`, `album`, `artist`) to per-platform search parameters for Netease, QQMusic, and Migu.

### Modified Capabilities

None — `webui-music-search-experience` and `webui-settings-preferences` remain unchanged at the spec level. The UI still presents category buttons and the search still supports category filtering; only the implementation location of the category mapping changes.

## Impact

- `webapi/services/music_service.py` — new `category` parameter on `search()`, delegates to translation module
- `webapi/services/search_category.py` — new file, the translation module
- `webapi/schemas/music.py` — `SearchRequest` gains optional `category` field
- `webui/src/api/client.ts` — remove `CATEGORY_SEARCH_RULES`, send `category` string in `buildSearchOverrides`
- `webui/src/types/index.ts` — `SearchCategory` type moved from frontend to shared concept (frontend keeps the string union for UI rendering)
