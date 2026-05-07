## ADDED Requirements

### Requirement: Main search view follows sample layout without top navigation
The WebUI SHALL provide a music search main view visually aligned with `webui/ui-sample/index.png` while omitting the sample's top navigation links.

#### Scenario: Initial main page render
- **WHEN** the user opens the WebUI
- **THEN** the page shows a music-branded search experience with a large central search input, source multi-select controls, a bottom audio player, and no top navigation bar

#### Scenario: Settings access is visible
- **WHEN** the user views the main search page
- **THEN** a settings icon button is available in the top-right area of the page

### Requirement: Search controls support query, category, sources, and limits
The WebUI SHALL allow users to enter a keyword, choose a search category tab, select one or more platforms, and apply a result limit before running search.

#### Scenario: Run search from main page
- **WHEN** the user enters a keyword and submits the search
- **THEN** the WebUI sends a search request using the selected platforms, saved platform settings, and configured result limit

#### Scenario: Prevent empty search
- **WHEN** the user submits search without a keyword
- **THEN** the WebUI shows a validation message and does not send a search request

### Requirement: Result view follows sample layout without top navigation
The WebUI SHALL show search results in a list layout aligned with `webui/ui-sample/result.png` while omitting the sample's top navigation links.

#### Scenario: Display search results
- **WHEN** a search succeeds with one or more songs
- **THEN** the WebUI shows rows with song title, artist, album, quality or format information, duration, source, and actions

#### Scenario: Display no results
- **WHEN** a search succeeds with no songs
- **THEN** the WebUI shows a polished empty state without breaking the page layout

### Requirement: Result actions include play and download
Each result row SHALL include actions for playback and download.

#### Scenario: Play result
- **WHEN** the user clicks the play action for a result
- **THEN** the WebUI resolves playback and sets the bottom audio player to the returned stream URL

#### Scenario: Download result
- **WHEN** the user clicks the download action for a result
- **THEN** the WebUI starts the configured download flow for that result

### Requirement: Bottom player remains available
The WebUI SHALL keep a bottom audio player available across the main, result, and settings views.

#### Scenario: Player persists across settings navigation
- **WHEN** a song is selected for playback and the user opens settings
- **THEN** the bottom player remains visible with the current song information and audio controls

### Requirement: Download state remains visible
The WebUI SHALL show download task state when server-side downloads are used.

#### Scenario: Server download task progresses
- **WHEN** a server-side download task is created
- **THEN** the WebUI displays task status, progress, errors if any, server artifact path, and browser download links for completed artifacts
