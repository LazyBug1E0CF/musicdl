## 1. Volume Control Logic

- [x] 1.1 Add `volume` state (`useState<number>(1)`), `prevVolumeRef` ref, and `volumePopupOpen` state to `BottomPlayer.tsx`
- [x] 1.2 Replace the decorative volume bar `<span />` with a clickable bar: `onClick` computes volume from click position, updates `volume` state and `audioRef.current.volume`
- [x] 1.3 Wrap volume icon in a `<button>`: toggles mute (saves/restores via `prevVolumeRef`); import `VolumeX` from lucide-react, show when muted
- [x] 1.4 Add `useEffect` that syncs `audioRef.current.volume = volume` whenever `volume` changes
- [x] 1.5 Add volume popup: on narrow screens, clicking the icon sets `volumePopupOpen`, renders a vertical `<input type="range">` popup above the icon

## 2. Responsive Layout

- [x] 2.1 At `max-width: 780px`: keep `.volume-wrap` visible but hide `.volume-bar`; show only the icon button
- [x] 2.2 Add `.volume-popup` CSS: absolutely positioned vertical slider above the volume icon
- [x] 2.3 At `max-width: 780px`: use `grid-row` to place `.player-progress-wrap` on row 1, `.player-track` / `.player-controls` / volume icon on row 2
- [x] 2.4 Remove `display: none` from `.volume-wrap` and `.favorite-button` at the 780px breakpoint (icon stays visible)

## 3. Verification

- [x] 3.1 Run `npx tsc --noEmit` to confirm TypeScript builds cleanly
- [ ] 3.2 Visual check: resize browser to <780px, verify volume icon visible, progress bar above controls, popup works
