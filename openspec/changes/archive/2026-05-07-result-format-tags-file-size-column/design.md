## Context

The WebUI result list currently renders title, artist, album, a combined format metadata cell, duration, source, and actions. The combined format cell displays format, bitrate, and file size as one text string, which is hard to scan and can hide details when the list is narrow.

The existing `SongResult` model already carries `format`, `bitrate`, and `fileSize` separately, so this change is a presentation/layout refinement rather than a data-contract change.

## Goals / Non-Goals

**Goals:**
- Render `format` and `bitrate` as separate tag-style visual chips in the result list.
- Keep each tag's full text visible; allow wrapping when space is constrained instead of truncating with ellipsis.
- Move file size to its own result-list column with its own header.
- Preserve existing result list actions, source badge, infinite scroll behavior, and empty/loading/no-more states.
- Keep the layout usable on narrow screens without overlapping text or controls.

**Non-Goals:**
- Changing WebAPI search response fields or `SongResult` data normalization.
- Adding new filters, sorting, or quality selection behavior.
- Changing download filename behavior or playback controls.
- Introducing a new table/grid dependency.

## Decisions

1. **Use the existing `SongResult` fields directly.**
   - `song.format`, `song.bitrate`, and `song.fileSize` are already normalized for display.
   - Rationale: avoids backend/API changes and keeps this change limited to the result list view.
   - Alternative considered: derive bitrate or file size from `raw` metadata at render time. This would duplicate normalization logic and make the UI less predictable.

2. **Represent format and bitrate as wrapping inline tags inside the format column.**
   - The format column will contain a small tag group, with one tag for format and one tag for bitrate when values are available.
   - Tags must use `white-space: normal` or equivalent wrapping-friendly styling so full text remains visible.
   - Rationale: users can scan audio quality quickly while still seeing uncommon or longer bitrate/codec labels.
   - Alternative considered: keep a single delimited string. This is simpler but does not solve the readability problem.

3. **Add a dedicated file-size column to the result grid.**
   - The result header and rows will include file size as a separate grid track.
   - Rationale: file size is useful for comparison but semantically different from format/bitrate.
   - Alternative considered: place file size under the song title. This would make file size harder to compare across rows.

4. **Tune responsive grid behavior rather than truncating metadata.**
   - Desktop can use an additional grid track for file size.
   - Narrow layouts can stack or wrap metadata within rows while preserving action button stability.
   - Rationale: the user explicitly requested complete display and wrapping when width is insufficient.

## Risks / Trade-offs

- Additional column width can make desktop rows denser -> Use compact tag styling and responsive grid tracks.
- Long bitrate or codec strings can increase row height -> Allow wrapping within the metadata tag group and maintain stable action/source controls.
- Existing CSS may apply overflow/ellipsis to result cells -> Audit result row styles and override metadata/file-size cells so they do not truncate required values.
