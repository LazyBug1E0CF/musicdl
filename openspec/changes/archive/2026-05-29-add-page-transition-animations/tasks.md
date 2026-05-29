## 1. CSS transitions for search bar morphing

- [x] 1.1 Add `transition` properties to `.search-bar` for `min-height`, `max-width`, `padding`, `box-shadow`
- [x] 1.2 Add `transition` to `.search-bar input` for `font-size`
- [x] 1.3 Add `transition` to `.search-bar .primary-gradient-button` for `min-height`, `padding`, `font-size`

## 2. Hero exit and results entrance animations

- [x] 2.1 Replace conditional rendering of `.hero-copy` with permanent DOM + CSS class toggle (`.hero-hidden`)
- [x] 2.2 Add CSS for `.hero-copy` exit animation: `opacity` + `transform: translateY(-20px)` with `transition: 0.3s`
- [x] 2.3 Always render ResultList in DOM, control visibility via CSS class (`.results-panel-visible`)
- [x] 2.4 Add CSS `@keyframes` for results panel entrance: fade in + slide up from 20px offset

## 3. Platform picker card with collapse

- [x] 3.1 Wrap SourcePicker in a card container with border, background, border-radius
- [x] 3.2 Add `collapsed` prop to SourcePicker and SourceGroupSection
- [x] 3.3 Implement collapsed rendering: hide group accordions (`max-height: 0; opacity: 0; overflow: hidden; transition: 0.35s`), show selected-chips row with expand button
- [x] 3.4 Add CSS for card container (background, border, shadow, padding) and collapsed row (flex, gap, chip tags)
- [x] 3.5 Wire `collapsed` state to `showResultsPanel` in SearchPage: expand on initial load, collapse after search

## 4. Polish and verify

- [x] 4.1 Ensure `aria-hidden="true"` on hero when hidden for accessibility
- [x] 4.2 Run `npx tsc --noEmit` to verify no TypeScript errors
- [x] 4.3 Manually verify: hero fades out, search bar shrinks smoothly, results fade in, card collapses/expands
