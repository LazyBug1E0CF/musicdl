## 1. Settings Model And Localization

- [x] 1.1 Add settings fields for optional maximum loaded results and download filename format.
- [x] 1.2 Hydrate new settings with backward-compatible defaults from existing localStorage data.
- [x] 1.3 Add localized labels/help text for maximum result limit, filename format, playlist controls, and no-more-results state.
- [x] 1.4 Remove the main-page result quantity control and related labels from the search view.

## 2. Incremental Search And Infinite Scroll

- [x] 2.1 Replace fixed result state with incremental search state including loaded results, per-source paging metadata, loading-more state, has-more state, and effective maximum.
- [x] 2.2 Implement API-client support for fetching search batches with per-source search rules for offset/page-style loading.
- [x] 2.3 Deduplicate appended search results by source and identifier before updating the result list.
- [x] 2.4 Compute default maximum loaded results as selected platform count multiplied by 5 when no explicit settings value exists.
- [x] 2.5 Add result-list scroll detection that requests another batch when the user approaches the end of the list.
- [x] 2.6 Stop requesting more results when no source returns new unique rows or the effective maximum is reached.
- [x] 2.7 Preserve loading, error, empty, and no-more-results states in the redesigned result view.

## 3. Custom Bottom Player And Queue

- [x] 3.1 Replace native visible audio controls with a hidden audio element and custom player UI controls.
- [x] 3.2 Add playback queue state derived from current search results and keep it stable across settings navigation.
- [x] 3.3 Implement play/pause control wired to the underlying audio element.
- [x] 3.4 Implement previous/next track controls using the current playback queue.
- [x] 3.5 Implement seekable progress control with elapsed and total time display.
- [x] 3.6 Update player state from audio events including loaded metadata, time update, play, pause, ended, and error.
- [x] 3.7 Implement expandable playlist UI with current track highlighting and track selection.
- [x] 3.8 Ensure player controls are keyboard and screen-reader accessible enough for button/slider usage.

## 4. Download Filename Formatting

- [x] 4.1 Add filename-format controls to the settings page with artist-first and song-first choices.
- [x] 4.2 Add frontend filename generation and sanitization helpers for browser-direct downloads.
- [x] 4.3 Send the configured filename format with server-side download requests.
- [x] 4.4 Update WebAPI download request handling to apply the configured filename format to saved artifact paths when metadata is available.
- [x] 4.5 Preserve safe fallback filenames when artist, title, extension, or source metadata is missing.
- [x] 4.6 Ensure artifact browser download links reflect the server-side formatted filename.

## 5. Styling And Responsive Behavior

- [x] 5.1 Restyle the bottom player to match `webui/ui-sample` visuals while keeping controls compact and stable.
- [x] 5.2 Style the expanded playlist so it works above the fixed bottom player on desktop and mobile.
- [x] 5.3 Ensure infinite-scroll loading and no-more indicators fit the result list without layout jumps.
- [x] 5.4 Verify text and controls do not overlap in search, result, settings, player, and playlist views at narrow widths.

## 6. Verification

- [x] 6.1 Run `cd webui && npm run build`.
- [x] 6.2 Run relevant backend static checks for any WebAPI schema or download changes.
- [x] 6.3 Rebuild Docker with `docker compose up -d --build`.
- [x] 6.4 Verify `GET http://localhost:8000/healthz`, `GET http://localhost:8000/readyz`, and `GET http://localhost:8080`.
- [x] 6.5 Browser-test empty search validation, infinite scroll loading, max-result cap, no-more state, custom player play/pause, seek, previous/next, playlist expansion/selection, settings persistence, and both filename formats for downloads.
