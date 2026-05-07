## 1. Result Data Normalization

- [x] 1.1 Add WebUI result metadata state for bitrate kind and quality tier without changing the raw API payload.
- [x] 1.2 Implement exact bitrate formatting from `song.bitrate` with a numeric quality tier.
- [x] 1.3 Implement estimated bitrate calculation from positive `file_size_bytes` and `duration_s` when exact bitrate is missing.
- [x] 1.4 Preserve fallback behavior for results that have neither exact nor estimable bitrate.

## 2. Result Tag Rendering

- [x] 2.1 Add format-specific class or data mapping for common audio formats and an unknown-format fallback.
- [x] 2.2 Add bitrate tier class or data mapping for green-to-gold quality levels.
- [x] 2.3 Render estimated bitrate with an approximation marker and accessible text that distinguishes it from exact bitrate.
- [x] 2.4 Keep format, bitrate, and file-size layout compatible with the separate file-size column change.

## 3. Styling

- [x] 3.1 Add distinct format tag color styles for common formats while maintaining readable contrast.
- [x] 3.2 Add green-to-gold bitrate tier styles with gold assigned to the highest tier.
- [x] 3.3 Add a visual distinction for estimated bitrate tags that does not rely on color alone.
- [x] 3.4 Verify tag wrapping still avoids truncation and overlap at desktop and narrow widths.

## 4. Verification

- [x] 4.1 Add or update focused WebUI tests for exact bitrate, estimated bitrate, and missing-metadata fallback normalization.
- [x] 4.2 Add or update rendering coverage for format classes, bitrate tier classes, and estimated labels.
- [x] 4.3 Run the WebUI build and relevant tests.
- [x] 4.4 Smoke test the result list in the browser with sample exact, estimated, and fallback metadata.
