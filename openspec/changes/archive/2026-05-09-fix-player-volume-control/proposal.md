## Why

The volume bar in the bottom player is purely decorative — it renders a visual bar but has no interaction and no connection to the `<audio>` element's `volume` property. On narrow viewports the volume control is completely hidden (`display: none`), and the progress bar sits below the playback controls in DOM order rather than above them.

## What Changes

- Add `volume` state and mute toggle to `BottomPlayer.tsx`
- Wire a click-to-seek volume bar that syncs to `audioRef.current.volume`
- Click the volume icon to toggle mute (remembering previous volume)
- On narrow viewports: hide the volume bar but keep the icon; click opens a vertical volume popup
- On narrow viewports: reorder CSS Grid so the progress bar renders above the playback control buttons
- Remove `display: none` on `.volume-wrap` from narrow breakpoints; instead hide only the bar and show icon

## Capabilities

### New Capabilities

- `player-volume-control`: The bottom player provides an interactive volume control with click-to-set volume bar, mute toggle, and responsive icon-only mode with popup on narrow screens.

### Modified Capabilities

None.

## Impact

- `webui/src/components/BottomPlayer.tsx` — add volume state, event handlers, mute toggle, popup toggle
- `webui/src/styles.css` — responsive layout changes for progress bar reorder and volume-wrap visibility
