## Context

`BottomPlayer.tsx` renders a `<audio>` element and a decorative volume bar. On narrow viewports (≤780px), the existing CSS hides `.volume-wrap` entirely. The progress bar appears below controls in DOM order.

## Goals / Non-Goals

**Goals:**
- Interactive volume bar with click-to-set volume (0–1)
- Mute toggle via volume icon
- Preserve volume across track changes
- On narrow viewports: hide volume bar, keep icon visible, click icon → vertical volume popup
- On narrow viewports: progress bar visually above playback controls

**Non-Goals:**
- Drag-to-adjust (click-to-seek is sufficient)
- Persisting volume across page reloads

## Decisions

### Decision 1: Click-to-seek volume bar

Use `onClick` on the volume bar container. Compute volume = `clickX / barWidth`, clamped to [0, 1].

### Decision 2: Mute via volume icon click

Wrap the icon in a `<button>`. Store pre-mute volume in `useRef` so it can be restored on unmute. Show `VolumeX` icon when muted.

### Decision 3: Volume state

- `volume` state: 0–1, default 1
- `prevVolumeRef`: stores value before muting
- `isMuted` state: derived from `volume === 0`
- `volumePopupOpen` state: controls popup visibility on narrow screens

Sync `audioRef.current.volume` in a `useEffect([volume])`.

### Decision 4: Responsive volume — icon + popup

Detect narrow viewport via a CSS media query (`max-width: 780px`). Use a `volumePopupOpen` state toggled by clicking the icon button. The popup renders as a vertical slider above the icon.

CSS changes in `styles.css`:
- At the 780px breakpoint: keep `.volume-wrap` visible (`display: flex` or grid), but hide `.volume-bar` by default
- Add `.volume-popup` class: absolute positioned vertical slider, visible when `volumePopupOpen` is true

### Decision 5: Progress bar above controls on narrow screens

Use CSS Grid placement at the 780px breakpoint:
```css
.player-progress-wrap {
  grid-row: 1;
  grid-column: 1 / -1;
}
.player-track {
  grid-row: 2;
  grid-column: 1;
}
.player-controls {
  grid-row: 2;
  grid-column: 2;
}
/* volume icon in column 3, row 2 */
```

This places the progress bar visually first without changing DOM order. The existing `grid-column: 1 / -1` on `.player-progress-wrap` already exists; just need to add explicit `grid-row` values for other children.

## Risks / Trade-offs

- The volume popup on narrow screens adds a small JS state that could have been pure CSS with `:hover`/`:focus-within`, but click-to-toggle is more intentional for touch devices.
