## Context

The core library (`musicdl/modules/sources/__init__.py`) registers 51 music platform clients in `MusicClientBuilder.REGISTERED_MODULES`. The web API correctly exposes all 51 via `GET /api/v1/sources`. However, the web UI's `SourcePicker` component filters this list through `preferredSourceOptions()` which hardcodes only 7 entries. The remaining 44 platforms are invisible to users, even though both the API and engine fully support them.

The 51 platforms are organized into five natural categories in the core library's source code:
- Greater China (12): QQ, Kugou, NetEase, Kuwo, Migu, Qianqian, StreetVoice, Soda, FiveSing, Bilibili, Bodian, MOOV
- Global Streaming (13): YouTube, Joox, Apple, Jamendo, SoundCloud, Deezer, Qobuz, Spotify, TIDAL, FMA, JioSaavn, OpenGameArt, Suno
- Audiobooks/Radio (5): Ximalaya, Lizhi, Qingting, LRTS, ITunes
- Aggregators (6): MP3Juice, TuneHub, GDStudio, MyFreeMP3, JBSou, WJHE
- Unofficial Download Sites (15): Mitu, Buguyy, Gequbao, etc.

The existing `displaySource()` fallback strips `MusicClient` suffix and inserts spaces at camelCase boundaries. This produces acceptable names for most platforms but fails for: Apple Music → "Apple", YouTube → "You Tube", SoundCloud → "Sound Cloud".

The frontend sends canonical platform names (e.g. `"QQMusicClient"`) directly to the backend — these are the raw keys from `REGISTERED_MODULES`. Backend `SOURCE_ALIASES` are never hit in normal operation because the frontend already uses canonical names. Therefore aliases are out of scope.

## Goals / Non-Goals

**Goals:**
- Show 31 music platforms (Greater China + Global Streaming + Aggregators) in the SourcePicker
- Organize platforms into collapsible category groups for scannability
- Fix the 3 incorrect fallback display names
- Keep the existing selection/chip UX pattern within each group

**Non-Goals:**
- Audiobook/radio platforms (5) — different content type, better served by a dedicated UI
- Unofficial download sites (15) — quality varies, would clutter the UI
- Backend SOURCE_ALIASES — not needed for frontend-driven operation
- Playback/streaming support — platform-dependent and out of scope
- Chinese localization for new platforms — fallback names are English; existing Chinese labels remain for the 7 already-localized

## Decisions

### 1. Group-by-category accordion over flat list or tabs

**Chosen: Collapsible accordion sections within the SourcePicker**

Alternatives considered:
- *Flat list of 31 chips*: Simplest to implement but overwhelming. Users must visually scan 31 identical-looking chips.
- *Tab bar switching categories*: Requires extra click to switch between categories, prevents seeing all selections at once.
- *Accordion with all groups expanded by default*: Chosen approach. Users see the most relevant group (Greater China) immediately, can collapse others. Default-expanded respects the "see everything" goal while allowing decluttering.

### 2. 31 platforms over all 51

**Chosen: Include Greater China (12), Global Streaming (13), Aggregators (6) = 31**

Audiobooks/radio are a different content type (spoken word, not music). Unofficial download sites are scrapers of varying reliability. Including them in the same picker as Spotify and NetEase would be misleading. They remain accessible via direct API calls for power users.

### 3. Fallback display names over full SOURCE_META entries

**Chosen: Add only 3 explicit labels to SOURCE_META, keep fallback for remaining 21**

The existing `displaySource()` fallback handles 21 of the 24 newly-visible platforms correctly. Adding all 24 as explicit entries would bloat SOURCE_META without value. The 3 that need fixes are well-known services where the fallback produces visibly wrong results.

### 4. Category data lives in sources.ts, not the API

**Chosen: Define `SOURCE_CATEGORIES` in the frontend only**

The backend doesn't have structured category metadata (categories exist only as code comments in `__init__.py`). Adding a new API field is unnecessary — the category mapping is static and only consumed by the UI. If the backend ever needs categories, they can be extracted later.

## Risks / Trade-offs

- **[New platforms with no cookie config]** → Users must configure cookies in Settings for platforms that require authentication (e.g., QQ, NetEase). The cookie dot indicator already works for any platform — no frontend change needed.
- **[Some platforms may fail silently]** → Platforms like Suno or OpenGameArt may have limited search coverage. This is a pre-existing engine limitation, not a UI issue. The UI correctly shows what the engine supports; search quality is the engine's responsibility.
- **[31 chips still dense on mobile]** → The accordion mitigates this. If needed, a "select all / deselect all" per group can be added later.
