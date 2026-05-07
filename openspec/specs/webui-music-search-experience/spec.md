# webui-music-search-experience Specification

## Purpose
TBD - created by archiving change redesign-webui-settings. Update Purpose after archive.
## Requirements
### Requirement: Main search view follows sample layout without top navigation
The WebUI SHALL provide a music search main view visually aligned with `webui/ui-sample/index.png` while omitting the sample's top navigation links.

#### Scenario: Initial main page render
- **WHEN** the user opens the WebUI
- **THEN** the page shows a music-branded search experience with a large central search input, source multi-select controls, a bottom audio player, and no top navigation bar

#### Scenario: Settings access is visible
- **WHEN** the user views the main search page
- **THEN** a settings icon button is available in the top-right area of the page

### Requirement: Search controls support query, category, sources, and limits
The WebUI SHALL allow users to enter a keyword, choose a search category tab, and select one or more platforms before running search. The main search page SHALL NOT expose a result quantity control; result loading SHALL instead use infinite scrolling up to the effective maximum configured in settings.

#### Scenario: Run search from main page
- **WHEN** the user enters a keyword and submits the search
- **THEN** the WebUI sends a search request using the selected platforms, selected category, saved platform settings, and the effective maximum result limit

#### Scenario: Prevent empty search
- **WHEN** the user submits search without a keyword
- **THEN** the WebUI shows a localized validation message and does not send a search request

#### Scenario: Result quantity control is absent
- **WHEN** the user views the main search page or result page
- **THEN** the WebUI does not show a main-page result count or quantity input

### Requirement: Result view follows sample layout without top navigation
The WebUI SHALL show search results in a list layout aligned with `webui/ui-sample/result.png` while omitting the sample's top navigation links. The result list SHALL support infinite scrolling that appends additional results until no source can provide more unique results or the effective maximum result limit is reached. Result rows SHALL present format and bitrate as complete tag-style metadata in the format column, file size SHALL be shown as a separate column, format tags SHALL use distinct colors for different audio formats, and bitrate tags SHALL use quality-tier colors from green to gold with gold representing the highest tier. When a result has no bitrate value but has usable file size and duration metadata, the WebUI SHALL estimate an approximate average bitrate from file size and duration and display that estimate as an approximate bitrate tag.

#### Scenario: Display search results
- **WHEN** a search succeeds with one or more songs
- **THEN** the WebUI shows rows with song title, artist, album, format tags, bitrate tags, file size, duration, source, and actions

#### Scenario: Display no results
- **WHEN** a search succeeds with no songs
- **THEN** the WebUI shows a polished empty state without breaking the page layout

#### Scenario: Load more results on scroll
- **WHEN** the user scrolls near the end of the result list and more results are available
- **THEN** the WebUI requests the next result batch and appends newly returned unique rows without replacing existing rows

#### Scenario: Stop loading when exhausted
- **WHEN** all selected platforms return no additional unique results or the effective maximum result limit has been reached
- **THEN** the WebUI stops requesting more results and shows that no more results are available

#### Scenario: Format and bitrate display as complete tags
- **WHEN** a result has format and bitrate metadata
- **THEN** the WebUI shows the format and bitrate as separate tag-style elements without truncating or abbreviating the displayed values

#### Scenario: Metadata tags wrap when space is limited
- **WHEN** the result row width is too narrow to fit all format and bitrate tags on one line
- **THEN** the tags wrap within the format column without overlapping adjacent columns, controls, or row content

#### Scenario: File size is a separate column
- **WHEN** a result has file-size metadata
- **THEN** the WebUI shows the file size in a dedicated file-size column instead of combining it with format or bitrate text

#### Scenario: Format tags use distinct colors
- **WHEN** search results include songs with different audio formats
- **THEN** the WebUI shows format tags using distinct format-specific colors while preserving readable text contrast

#### Scenario: Bitrate tags use quality tier colors
- **WHEN** search results include bitrate values across multiple quality levels
- **THEN** the WebUI maps bitrate tags to green-to-gold quality tiers with the highest bitrate tier shown in gold

#### Scenario: Missing bitrate is estimated from size and duration
- **WHEN** a search result has no bitrate value and has positive file-size and duration metadata
- **THEN** the WebUI estimates average bitrate using file size and duration and displays the value as an approximate bitrate tag

#### Scenario: Invalid metadata does not produce estimate
- **WHEN** a search result has no bitrate value and lacks usable file-size or duration metadata
- **THEN** the WebUI does not estimate a bitrate and falls back to the existing codec or empty bitrate display

#### Scenario: Estimated bitrate is visually distinct
- **WHEN** a bitrate tag uses an estimated value
- **THEN** the WebUI indicates that the value is approximate while still applying the matching quality-tier color

### Requirement: Result actions include play and download
Each result row SHALL include actions for playback and download.

#### Scenario: Play result
- **WHEN** the user clicks the play action for a result
- **THEN** the WebUI resolves playback and sets the bottom audio player to the returned stream URL

#### Scenario: Download result
- **WHEN** the user clicks the download action for a result
- **THEN** the WebUI starts the configured download flow for that result

### Requirement: Bottom player remains available
The WebUI SHALL keep a bottom audio player available across the main, result, and settings views. The bottom player SHALL use custom WebUI controls rather than browser-native audio controls and SHALL support a playback queue derived from current search results.

#### Scenario: Player persists across settings navigation
- **WHEN** a song is selected for playback and the user opens settings
- **THEN** the bottom player remains visible with the current song information and audio controls

#### Scenario: Custom playback controls
- **WHEN** a track is loaded in the bottom player
- **THEN** the WebUI shows custom previous, play or pause, next, progress, elapsed time, total time, and playlist controls without displaying browser-native audio controls

#### Scenario: Play and pause
- **WHEN** the user clicks the custom play or pause control
- **THEN** the WebUI starts or pauses the underlying audio playback and updates the player state

#### Scenario: Seek within track
- **WHEN** the user changes the custom progress control
- **THEN** the WebUI seeks the underlying audio element to the selected time

#### Scenario: Previous and next track
- **WHEN** the user clicks previous or next
- **THEN** the WebUI switches to the adjacent track in the current playback queue when one exists

#### Scenario: Expand playlist
- **WHEN** the user opens the player playlist
- **THEN** the WebUI shows the queued tracks and allows selecting a track for playback

### Requirement: Download state remains visible
The WebUI SHALL show download task state when server-side downloads are used.

#### Scenario: Server download task progresses
- **WHEN** a server-side download task is created
- **THEN** the WebUI displays task status, progress, errors if any, server artifact path, and browser download links for completed artifacts
