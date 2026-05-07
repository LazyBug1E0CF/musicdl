## 1. Result List Rendering

- [x] 1.1 Add a file-size label to `ResultList` props and pass the existing localized file-size label from `SearchPage`.
- [x] 1.2 Update the result header to include a dedicated file-size column after the format column.
- [x] 1.3 Replace the combined `format · bitrate · fileSize` text with a format metadata tag group containing separate format and bitrate tags.
- [x] 1.4 Render file size in its own row cell and preserve existing duration, source, and action cells.

## 2. Layout And Styling

- [x] 2.1 Update `.result-grid` desktop column tracks to account for the new file-size column without crowding action buttons.
- [x] 2.2 Add styles for format/bitrate metadata tags that show complete text, do not use ellipsis, and allow wrapping within the format cell.
- [x] 2.3 Adjust existing result-row overflow rules so metadata tags and file-size values are not unintentionally truncated.
- [x] 2.4 Update tablet and mobile responsive rules so the new file-size column/cell wraps or stacks cleanly without overlap.

## 3. Verification

- [x] 3.1 Run `cd webui && npm run build`.
- [x] 3.2 Browser-test result rows at desktop and narrow widths with long format/bitrate/file-size values to confirm tags wrap and remain complete.
- [x] 3.3 Verify loading, empty, infinite-scroll footer, source badge, play, and download actions still render correctly after the grid change.
