## MODIFIED Requirements

### Requirement: Result view follows sample layout without top navigation
The WebUI SHALL show search results in a list layout aligned with `webui/ui-sample/result.png` while omitting the sample's top navigation links. The result list SHALL support infinite scrolling that appends additional results until no source can provide more unique results or the effective maximum result limit is reached. Result rows SHALL present format and bitrate as complete tag-style metadata in the format column, and file size SHALL be shown as a separate column.

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
