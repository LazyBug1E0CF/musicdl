## Why

The current WebUI can search, play, and download music, but result loading still depends on a manual result-count setting and the player relies on browser-native controls. Users need a more music-app-like experience with progressive result loading, a custom controllable player, playlist expansion, and predictable downloaded filenames.

## What Changes

- Remove the user-facing search result count control from the main page.
- Replace fixed result fetching with infinite scroll that loads more results until no more results are available or a configured maximum is reached.
- Move the maximum result limit into settings, defaulting to selected platform count multiplied by 5.
- Replace browser-native audio controls with a custom bottom player aligned with `webui/ui-sample` player visuals.
- Add real custom player controls: previous/next track, play/pause, seekable progress bar, elapsed/total time, current track display, and expanded playlist.
- Maintain a playback queue from current search results and allow users to pick tracks from the expanded playlist.
- Add a settings preference for downloaded filename format:
  - artist first: `艺人-歌曲名`
  - song first: `歌曲名-艺人`
- Apply the chosen filename format to server-side downloads and browser-direct download filenames.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `webui-music-search-experience`: Search results now load progressively with infinite scrolling, no main-page result-count control, and the bottom player becomes a custom queue-aware player.
- `webui-settings-preferences`: Settings now include maximum result limit behavior and download filename format preferences.

## Impact

- Affects `webui/` React page/components, Zustand state, API client paging/search orchestration, styles, and localization.
- May require WebAPI request or response support for incremental search paging, per-source offsets, or server download filename overrides.
- Affects download task creation and browser-direct download naming.
- Requires careful handling of player state, queue state, audio events, and responsive layout so the custom player does not block search/results/settings controls.
