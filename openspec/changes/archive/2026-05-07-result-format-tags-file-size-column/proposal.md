## Why

The current result list combines format, bitrate, and file size into one text-heavy column, which makes audio quality details harder to scan and can truncate or visually compress important metadata. Users need format and bitrate to read as distinct tags, while file size should be comparable in its own column.

## What Changes

- Show result format and bitrate as separate tag-style chips in the result list format column.
- Ensure format and bitrate tags display their full text without ellipsis; when horizontal space is limited, the tags may wrap within the row.
- Move file size out of the format column into a dedicated file-size column.
- Keep the result list layout stable and responsive across desktop and narrow mobile widths.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `webui-music-search-experience`: Result rows must present format and bitrate as complete tag-style metadata and expose file size as a separate column.

## Impact

- Affects `webui/src/components/ResultList.tsx` result row/header rendering.
- Affects `webui/src/styles.css` result grid, tag/chip wrapping, and responsive column behavior.
- May affect localization labels if the existing file-size label is not currently wired into the result header.
- No WebAPI or core `musicdl` data contract changes are expected because result metadata already includes format, bitrate, and file size.
