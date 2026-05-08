## 1. Backend — Translation Module

- [x] 1.1 Create `webapi/services/search_category.py` with `SearchCategory` enum (`song`, `album`, `artist`) and `CATEGORY_SEARCH_RULES` mapping for Netease, QQMusic, and Migu
- [x] 1.2 Implement `translate_search_category(category, sources) → dict[str, dict]` function, with unknown sources returning `{}` and invalid categories falling back to `song`

## 2. Backend — API Integration

- [x] 2.1 Add `category: str = "song"` field to `SearchRequest` in `webapi/schemas/music.py`
- [x] 2.2 Update `MusicService.search()` in `webapi/services/music_service.py` to accept `category`, call `translate_search_category`, and merge the result with caller-supplied `overrides.search_rules` (caller overrides take precedence)

## 3. Frontend — Simplify Category Logic

- [x] 3.1 Remove `CATEGORY_SEARCH_RULES` constant and category-related rule construction from `webui/src/api/client.ts` `buildSearchOverrides()`
- [x] 3.2 Add `category` field to the search request body in `searchSongBatch()`, sourced from `params.category`
- [x] 3.3 Remove `all` option from `SearchCategory` type in `webui/src/types/index.ts` and from the category tab list in `webui/src/pages/SearchPage.tsx`
- [x] 3.4 Update translations in `webui/src/locales/zh-CN.ts` and `en-US.ts` to remove `category.all` key
- [x] 3.5 Change default `searchParams.category` in `webui/src/store/useAppStore.ts` from `'all'` to `'song'`

## 4. Verification

- [x] 4.1 Run `npx tsc --noEmit` in `webui/` to confirm TypeScript builds cleanly
- [x] 4.2 Verify `uvicorn webapi.app:app` starts without import errors and `/api/v1/search` accepts `category` field
