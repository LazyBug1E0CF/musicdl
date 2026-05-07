# webui-settings-preferences Specification

## Purpose
TBD - created by archiving change redesign-webui-settings. Update Purpose after archive.
## Requirements
### Requirement: Settings page follows sample layout
The WebUI SHALL provide a settings page visually aligned with `webui/ui-sample/settings.png`.

#### Scenario: Open settings from main page
- **WHEN** the user clicks the top-right settings icon button
- **THEN** the WebUI opens a settings view with a title, platform cookie configuration area, default download behavior area, and persistent bottom player

#### Scenario: Return from settings
- **WHEN** the user leaves the settings view
- **THEN** the WebUI returns to the previous search/results state without clearing the current query, results, selected sources, or player state

### Requirement: Per-platform cookies can be configured
The settings page SHALL allow users to configure cookies independently for each supported platform shown in the WebUI.

#### Scenario: Save platform cookies
- **WHEN** the user selects a platform, enters a cookie string, and saves
- **THEN** the WebUI persists that cookie value for the selected platform and uses it in subsequent relevant requests for that platform

#### Scenario: Clear platform cookies
- **WHEN** the user selects a platform with saved cookies and clicks clear
- **THEN** the WebUI removes saved cookies for that platform and no longer sends them in subsequent requests

### Requirement: Cookie values are treated as sensitive
The WebUI SHALL treat platform cookie values as sensitive data.

#### Scenario: Cookie values are not shown outside editor
- **WHEN** cookies have been saved
- **THEN** the WebUI does not display full cookie values in source chips, result rows, download queues, notifications, or logs

#### Scenario: Cookie values are sent only when needed
- **WHEN** the WebUI sends search, playback resolution, or download requests for selected platforms
- **THEN** only the cookies configured for the relevant platform are included in the request overrides

### Requirement: Default download behavior can be configured
The settings page SHALL allow users to configure default download behavior.

#### Scenario: Server media library mode
- **WHEN** the default download behavior is set to server media library mode
- **THEN** clicking a result download action creates a backend download task and displays task progress

#### Scenario: Browser direct mode
- **WHEN** the default download behavior is set to browser direct mode
- **THEN** clicking a result download action attempts to download through the browser from an available direct URL and falls back to server task download if a direct browser download is unavailable

#### Scenario: Auto import setting
- **WHEN** server media library mode is enabled and auto import is enabled
- **THEN** completed server-side artifacts remain registered and available in the download queue for playback or browser download links

### Requirement: Maximum loaded result limit can be configured
The settings page SHALL allow users to configure the maximum number of search results that infinite scrolling may load. When the user has not configured a value, the WebUI SHALL use the number of selected platforms multiplied by 5 as the effective maximum.

#### Scenario: Default maximum follows selected platforms
- **WHEN** the user has not configured a maximum result limit and searches with N selected platforms
- **THEN** the WebUI uses N multiplied by 5 as the effective maximum number of loaded results

#### Scenario: Custom maximum result limit
- **WHEN** the user configures a maximum result limit in settings
- **THEN** subsequent searches use that configured value as the maximum number of loaded results

#### Scenario: Maximum result setting persists
- **WHEN** the user changes the maximum result limit and reloads the page
- **THEN** the WebUI restores the configured maximum before the next search

### Requirement: Download filename format can be configured
The settings page SHALL allow users to choose whether downloaded filenames are generated as artist first (`艺人-歌曲名`) or song first (`歌曲名-艺人`). The WebUI and WebAPI SHALL apply the selected filename format to browser-direct and server-side downloads where the source metadata is available.

#### Scenario: Artist-first filename format
- **WHEN** the filename format is set to artist first and the user downloads a result with artist and song title metadata
- **THEN** the requested download filename uses `艺人-歌曲名` before the file extension

#### Scenario: Song-first filename format
- **WHEN** the filename format is set to song first and the user downloads a result with artist and song title metadata
- **THEN** the requested download filename uses `歌曲名-艺人` before the file extension

#### Scenario: Filename metadata fallback
- **WHEN** artist or song title metadata is missing
- **THEN** the WebUI or WebAPI generates a safe filename from the available metadata without blocking the download

#### Scenario: Server download uses configured format
- **WHEN** the user starts a server-side download
- **THEN** the backend saves or registers the artifact using the configured filename format where possible

#### Scenario: Browser direct download uses configured format
- **WHEN** the user starts a browser-direct download
- **THEN** the browser download request uses the configured filename format in the anchor download attribute

### Requirement: Settings persist across reloads
The WebUI SHALL persist settings across browser reloads on the same device.

#### Scenario: Reload after saving settings
- **WHEN** the user saves platform cookies or download behavior settings and reloads the page
- **THEN** the WebUI restores those settings before the next user-initiated search or download

### Requirement: Settings integrate with request overrides
The WebUI SHALL translate saved settings into backend request overrides without changing the existing core search/play/download user flows.

#### Scenario: Search uses cookie overrides
- **WHEN** the user searches with a platform that has saved cookies
- **THEN** the WebUI sends those cookies through per-source backend overrides for search

#### Scenario: Download uses cookie overrides
- **WHEN** the user downloads a result from a platform that has saved cookies
- **THEN** the WebUI sends those cookies through per-source backend overrides for download
