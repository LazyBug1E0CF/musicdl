## ADDED Requirements

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
