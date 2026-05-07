## Why

The current WebUI is functional but still reads as an operational table rather than a polished music search product. Users also cannot configure platform cookies or default download behavior from the browser, which limits access to account-dependent or higher-quality results.

## What Changes

- Redesign the main WebUI to match the visual direction in `webui/ui-sample/index.png` and `webui/ui-sample/result.png`, while omitting the top navigation bar shown in those samples.
- Keep the main page focused on music search with a large search surface, source multi-select controls, result list, bottom audio player, and a settings icon button in the top-right corner.
- Update the result list action column to include both playback and download actions.
- Add a settings page based on `webui/ui-sample/settings.png`.
- Allow users to configure per-platform cookies in settings.
- Allow users to configure default download behavior, including server-side media library download, browser-direct download preference, and post-download media library import behavior.
- Persist settings locally and apply them to subsequent search, playback, and download requests where relevant.
- No breaking API changes are intended; new backend fields or endpoints may be added if needed for settings persistence or safer cookie handling.

## Capabilities

### New Capabilities
- `webui-music-search-experience`: Covers the redesigned search page, source selection, search result presentation, playback control, and result action behavior.
- `webui-settings-preferences`: Covers the settings page, per-platform cookie configuration, default download behavior configuration, persistence, and applying settings to WebUI requests.

### Modified Capabilities

None.

## Impact

- Affects `webui/` React components, state management, API client, styles, localization, and routing/page structure.
- May affect `webapi/` request schemas or settings-related endpoints if server-side cookie handling is chosen during implementation.
- Uses existing backend capabilities for search, playback resolution, download tasks, task streaming, and artifact download.
- Requires careful handling of sensitive cookies so they are not logged or exposed unnecessarily.
