# search-category-translation Specification

## Purpose

Define a backend-owned translation layer that maps neutral search categories (song, album, artist) to per-platform search parameters, moving the mapping logic from the WebUI frontend into the API layer.

## Requirements

### Requirement: SearchCategory enum defines neutral category vocabulary

The API layer SHALL define a `SearchCategory` enum with values `SONG = "song"`, `ALBUM = "album"`, and `ARTIST = "artist"` that represents search categories independent of any specific music platform.

#### Scenario: Enum values are available

- **WHEN** the translation module is imported
- **THEN** `SearchCategory.SONG.value` is `"song"`, `SearchCategory.ALBUM.value` is `"album"`, and `SearchCategory.ARTIST.value` is `"artist"`

### Requirement: Translation table maps categories to per-source search parameters

The API layer SHALL maintain a mapping from `SearchCategory` to per-platform search parameters for each music source that natively supports category-filtered search.

#### Scenario: Song category maps to verified sources

- **WHEN** category is `song`
- **THEN** the translation returns `{"type": 1}` for NeteaseMusicClient, `{"search_type": 0}` for QQMusicClient, and `{"searchSwitch": {"song": 1, "album": 0, "singer": 0}}` for MiguMusicClient

#### Scenario: Album category maps to verified sources

- **WHEN** category is `album`
- **THEN** the translation returns `{"type": 10}` for NeteaseMusicClient, `{"search_type": 2}` for QQMusicClient, and `{"searchSwitch": {"song": 0, "album": 1, "singer": 0}}` for MiguMusicClient

#### Scenario: Artist category maps to verified sources

- **WHEN** category is `artist`
- **THEN** the translation returns `{"type": 100}` for NeteaseMusicClient, `{"search_type": 1}` for QQMusicClient, and `{"searchSwitch": {"song": 0, "album": 0, "singer": 1}}` for MiguMusicClient

### Requirement: translate_search_category function produces per-source rule dicts

The translation module SHALL expose a `translate_search_category(category, sources)` function that accepts a category string and a list of source names, and returns a dict mapping each source name to its category-specific search rule dict.

#### Scenario: Translation for known source

- **WHEN** `translate_search_category("song", ["NeteaseMusicClient", "QQMusicClient"])` is called
- **THEN** it returns `{"NeteaseMusicClient": {"type": 1}, "QQMusicClient": {"search_type": 0}}`

#### Scenario: Translation for unknown source falls through

- **WHEN** `translate_search_category("song", ["KuwoMusicClient"])` is called
- **THEN** it returns `{"KuwoMusicClient": {}}` because Kuwo is not in the translation table

#### Scenario: Invalid category falls back to song

- **WHEN** `translate_search_category("invalid", ["NeteaseMusicClient"])` is called
- **THEN** it returns `{"NeteaseMusicClient": {"type": 1}}` by defaulting to song

### Requirement: Search API accepts category parameter

The `POST /api/v1/search` endpoint SHALL accept an optional `category` field that defaults to `"song"` and passes it through `translate_search_category` to produce source-specific search rules.

#### Scenario: Search with category song

- **WHEN** a search request includes `{"keyword": "test", "sources": ["NeteaseMusicClient"], "category": "song"}`
- **THEN** the API calls `MusicService.search()` with category `"song"`, and the resulting `search_rules` for NeteaseMusicClient includes `{"type": 1}`

#### Scenario: Search without category defaults to song

- **WHEN** a search request omits the `category` field
- **THEN** the API uses `"song"` as the default

#### Scenario: Category overrides are mergeable

- **WHEN** a search request includes both `category: "song"` and `overrides.search_rules: {"NeteaseMusicClient": {"offset": 50}}`
- **THEN** the final search rules for NeteaseMusicClient are `{"type": 1, "offset": 50}` — the caller's overrides take precedence over category rules

### Requirement: WebUI sends category as a string, not platform-specific parameters

The WebUI search client SHALL send the `category` field as a plain string (`"song"`, `"album"`, or `"artist"`) in the search request body and SHALL NOT include platform-specific search type parameters in the `overrides.search_rules` it constructs.

#### Scenario: Category sent as string in search request

- **WHEN** the user selects a category tab and runs a search
- **THEN** the request body includes `"category": <selected category string>` and `overrides.search_rules` contains only paging rules, not category-specific parameters
