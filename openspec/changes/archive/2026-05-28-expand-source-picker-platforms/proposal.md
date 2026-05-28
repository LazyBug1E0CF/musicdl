## Why

The web UI's SourcePicker currently hardcodes only 7 music platforms (NetEase, QQ, Kugou, Kuwo, Migu, Spotify, Apple Music), while the core library registers 51 platforms. Users cannot access 44 of the engine's supported platforms through the UI — including well-known services like YouTube, Deezer, SoundCloud, TIDAL, and Bilibili. This change expands the visible platform set to the 31 mainstream sources across three categories, making the web UI a faithful interface to the engine's capabilities.

## What Changes

- Expand the SourcePicker from 7 hardcoded platforms to 31, covering Greater China (12), Global Streaming (13), and Aggregator (6) categories
- Add category-based grouping with collapsible sections in the SourcePicker UI
- Fill in display labels for 3 platforms where the fallback name generation produces incorrect results (Apple Music → "Apple", YouTube → "You Tube", SoundCloud → "Sound Cloud")
- All other platforms continue using the existing automatic name fallback without individual overrides
- Explicitly exclude audiobook/radio platforms (5) and unofficial download sites (15) from the UI — they remain available via direct API calls

## Capabilities

### New Capabilities

- `source-picker-expanded`: The SourcePicker component in the web UI displays 31 platforms organized in 3 collapsible category groups (Greater China, Global Streaming, Aggregators), with proper display names for all entries.

### Modified Capabilities

<!-- No existing specs to modify -->

## Impact

- **webui/src/utils/sources.ts**: SOURCE_META gets 3 new label entries; new SOURCE_CATEGORIES mapping; preferredSourceOptions expanded to 31 entries
- **webui/src/components/SourcePicker.tsx**: Renders grouped, collapsible category sections instead of flat chip grid
- **webui/src/pages/SearchPage.tsx**: No structural changes needed (passes options through as-is)
- **webapi/services/music_service.py**: No changes (aliases not needed for functionality)
- **webapi/services/playback_service.py**: No changes (streaming support is platform-dependent, out of scope)
