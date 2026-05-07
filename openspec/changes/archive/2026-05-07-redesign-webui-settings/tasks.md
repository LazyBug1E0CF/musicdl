## 1. Settings Model And Request Wiring

- [x] 1.1 Define WebUI settings types for per-source cookies, selected cookie platform, default download mode, and auto-import preference.
- [x] 1.2 Add localStorage persistence and hydration for settings in the Zustand store.
- [x] 1.3 Add cookie parsing utilities that convert semicolon-delimited cookie strings into backend-compatible cookie maps.
- [x] 1.4 Update WebUI API request builders to include per-source `default_search_cookies`, `default_download_cookies`, and related overrides from saved settings.
- [x] 1.5 Ensure cookie values are never rendered in alerts, task logs, visible summaries, or console/debug output.

## 2. Application Structure

- [x] 2.1 Split the current single `App.tsx` layout into search page, settings page, bottom player, source selector, result list, and download queue components.
- [x] 2.2 Implement lightweight page state for switching between search/results and settings without adding a router dependency.
- [x] 2.3 Preserve current search results, selected sources, current song, playback URL, and download tasks when navigating between views.
- [x] 2.4 Add localized labels for all new settings, download mode, action, validation, and sensitive-cookie warning text.

## 3. Redesigned Main And Result Views

- [x] 3.1 Rebuild the main search layout to match `webui/ui-sample/index.png` without the top navigation bar.
- [x] 3.2 Add a top-right settings icon button that opens the settings page.
- [x] 3.3 Implement category tabs, large search input, result limit behavior, and source multi-select controls in the redesigned layout.
- [x] 3.4 Rebuild the results list to match `webui/ui-sample/result.png` without the top navigation bar.
- [x] 3.5 Add play and download actions to each result row, including loading and disabled states.
- [x] 3.6 Keep empty, loading, and error states visually aligned with the redesigned page.

## 4. Settings Page

- [x] 4.1 Build the settings page layout based on `webui/ui-sample/settings.png`.
- [x] 4.2 Add a platform list for available sources and a cookie editor for the active platform.
- [x] 4.3 Implement save and clear actions for platform cookies.
- [x] 4.4 Add default download behavior controls for server media library and browser direct modes.
- [x] 4.5 Add the auto-import setting and ensure it only applies to server media library mode.
- [x] 4.6 Add clear user guidance that cookies are stored locally and platform requirements vary.

## 5. Download Behavior

- [x] 5.1 Keep server media library downloads using `/api/v1/download`, task SSE, task status, and artifact links.
- [x] 5.2 Implement browser direct download attempts from available direct URLs when browser direct mode is selected.
- [x] 5.3 Fall back from browser direct mode to server task download when no direct URL is available.
- [x] 5.4 Show task status, progress, server path, errors, and artifact browser download links for server-side downloads.

## 6. Responsive Styling And Visual Polish

- [x] 6.1 Implement the sample-inspired background, soft gradients, glass panels, source chips, quality badges, icon buttons, and persistent bottom player styling.
- [x] 6.2 Ensure desktop layout matches the sample proportions while leaving room for real result content.
- [x] 6.3 Add mobile and narrow viewport layouts that avoid overlapping controls, result rows, settings panels, and the bottom player.
- [x] 6.4 Verify text does not overflow buttons, source chips, result cells, settings tabs, or player controls.

## 7. Verification

- [x] 7.1 Run `cd webui && npm run build`.
- [x] 7.2 Run relevant backend static checks if any WebAPI schema or endpoint changes are needed.
- [x] 7.3 Rebuild Docker with `docker compose up -d --build`.
- [x] 7.4 Verify `GET http://localhost:8000/healthz`, `GET http://localhost:8000/readyz`, and `GET http://localhost:8080`.
- [x] 7.5 Browser-test initial search page, search results, playback, both download modes, settings open/return, cookie save/clear, and reload persistence.
