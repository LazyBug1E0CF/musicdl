## Context

The WebUI search page has category tabs (`song` / `album` / `artist`) that produce `SearchCategory` values. Currently `webui/src/api/client.ts` holds a `CATEGORY_SEARCH_RULES` constant that maps these categories to Netease (`type: 1/10/100`) and QQMusic (`search_type: 0/2/1`) parameters. These rules are embedded in `buildSearchOverrides()` and sent as `overrides.search_rules` in the search request body.

The core library (`musicdl/modules/sources/`) already accepts `rule` parameters through `_constructsearchurls(keyword, rule)` where each source merges its defaults with the incoming rule. This means the infrastructure for per-source search typing already exists — it's only the mapping logic that needs to move.

## Goals / Non-Goals

**Goals:**
- Define a backend-owned `SearchCategory` enum (`song`, `album`, `artist`) as the canonical search category vocabulary
- Build a translation table that maps `{category → {source_name: source_params}}` for sources with known category support (Netease, QQMusic, Migu)
- Expose the category in the search API so the WebUI sends a plain string instead of constructing platform-specific rules
- Keep the core library (`musicdl/`) untouched

**Non-Goals:**
- Adding category support to sources that don't natively support it (Kuwo, Kugou, etc.) — these will use their default search behavior
- Changing the WebUI category UI (tabs, labels, interaction)
- Modifying the `_constructsearchurls` implementations in any source

## Decisions

### Decision 1: Translation layer location — `webapi/services/search_category.py`

The mapping lives in the API layer because:
- It's the integration boundary between the generic WebUI and platform-specific core library
- Same pattern as `playback_service.py` which already translates generic requests to source-specific operations
- Frontend stays ignorant of whether Netease uses `type` vs QQMusic uses `search_type`

### Decision 2: Module structure — pure functions, no class

The translation module exports:
- `SearchCategory` enum with values `SONG = "song"`, `ALBUM = "album"`, `ARTIST = "artist"`
- `CATEGORY_SEARCH_RULES: dict[SearchCategory, dict[str, dict]]` — category → source name → rule params
- `translate_search_category(category: str, sources: list[str]) → dict[str, dict]` — returns `{source_name: rule_dict}` for `MusicService.search()` to pass as `search_rules`

No class needed — this is a stateless mapping, unlike `MusicService` which manages client instances.

### Decision 3: Category-aware sources

Translations based on verified API support:

| Category | NeteaseMusicClient | QQMusicClient | MiguMusicClient |
|----------|-------------------|----------------|-----------------|
| `song` | `type: 1` | `search_type: 0` | `searchSwitch: {song:1, album:0, singer:0}` |
| `album` | `type: 10` | `search_type: 2` | `searchSwitch: {song:0, album:1, singer:0}` |
| `artist` | `type: 100` | `search_type: 1` | `searchSwitch: {song:0, album:0, singer:1}` |

Other sources (Kuwo, Kugou, Bilibili, Deezer, Spotify, YouTube, etc.) are not included in the translation table. When `translate_search_category` encounters a source not in the table, it returns `{}` for that source, which preserves existing default search behavior.

### Decision 4: API contract — add `category` to `SearchRequest`

```python
class SearchRequest(BaseModel):
    keyword: str
    sources: list[str] = Field(default_factory=list)
    category: str = "song"  # NEW
    overrides: APIConfig = Field(default_factory=APIConfig)
```

`category` defaults to `"song"`. The existing `overrides.search_rules` continues to work — `translate_search_category` produces rules that are merged under the caller's per-source search rules, so any user-specified overrides in `overrides.search_rules` still take priority.

### Decision 5: Frontend — remove CATEGORY_SEARCH_RULES, send category string

`buildSearchOverrides()` changes from:
```typescript
// old: frontend builds platform-specific search_rules
const categoryRules = CATEGORY_SEARCH_RULES[params.category] ?? {};
search_rules: sources.map(source => [source, { ...categoryRules[source], ...pagingRules[source] }])
```
to:
```typescript
// new: frontend sends category string, backend translates
body: JSON.stringify({
  keyword: params.keyword.trim(),
  sources: params.sources,
  category: params.category,  // "song" | "album" | "artist"
  overrides: buildSearchOverrides(params, paging, settings),
})
```

`buildSearchOverrides` no longer includes category rules — only paging and cookie overrides.

## Risks / Trade-offs

- **Adding category params for unsupported sources produces silent no-ops**: When a source doesn't appear in the translation table, it gets `{}` rules and uses its default search behavior. This is acceptable — the user still gets results, just not narrowly filtered by category. → Documented in the module docstring.

- **Some sources may partially support categories via different API endpoints**: For example, Kuwo has separate endpoints for song search vs. artist search. The current translation approach only overrides parameters, not endpoint URLs. → Out of scope; can be addressed per-source in follow-up changes.

- **Backward compatibility**: The `category` field defaults to `"song"`, matching the previous implicit default where all sources used song-type search parameters. Existing `overrides.search_rules` still flow through.

## Open Questions

None — the three verified sources (Netease, QQMusic, Migu) have confirmed parameter schemas from codebase exploration.
