## MODIFIED Requirements

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
