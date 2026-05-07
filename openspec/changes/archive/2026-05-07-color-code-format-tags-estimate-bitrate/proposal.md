## Why

Search results currently present format and bitrate metadata without visual quality hierarchy, and many search results do not include a bitrate even when file size and duration are available. Users need scan-friendly quality tags that distinguish formats and approximate missing bitrate values without pretending estimates are exact measurements.

## What Changes

- Color-code format tags so different audio formats are visually distinct in result rows.
- Assign bitrate tags to quality tiers using a green-to-gold scale, where gold represents the highest bitrate tier.
- When a result has no bitrate but has usable file size and duration metadata, estimate an approximate average bitrate from file size and duration.
- Display estimated bitrate values with a visible approximation marker so users can distinguish them from source-provided or probed values.
- Keep tag text complete and wrappable within the existing result list layout.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `webui-music-search-experience`: Result rows must color-code format and bitrate metadata, and estimate missing bitrate from file size and duration when possible.

## Impact

- Affects WebUI result normalization in `webui/src/api/client.ts`.
- Affects WebUI result row rendering in `webui/src/components/ResultList.tsx`.
- Affects result tag styling and responsive behavior in `webui/src/styles.css`.
- May affect WebUI result types in `webui/src/types/index.ts` to carry bitrate estimate state.
- Does not require new backend fields because `file_size_bytes`, `duration_s`, `bitrate`, `codec`, and `ext` are already present in the WebAPI song payload.
- Builds on the active `result-format-tags-file-size-column` change; archive or sync that change first if both changes are being finalized.
