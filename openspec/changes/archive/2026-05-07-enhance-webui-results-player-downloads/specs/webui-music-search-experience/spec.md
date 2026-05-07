## MODIFIED Requirements

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
The WebUI SHALL show search results in a list layout aligned with `webui/ui-sample/result.png` while omitting the sample's top navigation links. The result list SHALL support infinite scrolling that appends additional results until no source can provide more unique results or the effective maximum result limit is reached.

#### Scenario: Display search results
- **WHEN** a search succeeds with one or more songs
- **THEN** the WebUI shows rows with song title, artist, album, quality or format information, duration, source, and actions

#### Scenario: Display no results
- **WHEN** a search succeeds with no songs
- **THEN** the WebUI shows a polished empty state without breaking the page layout

#### Scenario: Load more results on scroll
- **WHEN** the user scrolls near the end of the result list and more results are available
- **THEN** the WebUI requests the next result batch and appends newly returned unique rows without replacing existing rows

#### Scenario: Stop loading when exhausted
- **WHEN** all selected platforms return no additional unique results or the effective maximum result limit has been reached
- **THEN** the WebUI stops requesting more results and shows that no more results are available

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
