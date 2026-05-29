## Context

The SearchPage currently uses conditional rendering (`{!show && <Hero/>}`, `{show && <Results/>}`) to switch between the initial hero state and the search results state. This causes elements to instantly appear/disappear with no visual transition. The search bar also changes size via CSS class toggle (`search-console-compact`) but has no transition properties, making the resize instant.

The project has no animation library dependency. The goal is to add smooth transitions without adding any npm packages.

## Goals / Non-Goals

**Goals:**
- Smooth search bar morphing (height, width, padding) using CSS transitions
- Hero section fades out + slides up on search
- Results panel fades in + slides up on first appearance
- Platform picker wraps in a card, collapses to compact row after search, expands back via toggle
- All animations use pure CSS (transitions + keyframes), zero dependencies added

**Non-Goals:**
- framer-motion or any JS animation library
- Animating individual list items (staggered entry) — out of scope
- Animations on settings page, download queue, bottom player
- Complex layout animations (chips flying between positions)

## Decisions

### 1. Keep-in-DOM over conditional rendering

**Chosen: Hero and results always in DOM, visibility controlled by CSS classes.**

Current code removes hero from DOM when `showResultsPanel` is true, and adds results. This makes exit animations impossible with pure CSS — the element is gone before any transition can run.

With the keep-in-DOM approach:
- Hero: always rendered, gets class `hero-hidden` when results shown. CSS: `transition: opacity 0.3s, transform 0.3s; .hero-hidden { opacity: 0; transform: translateY(-20px); pointer-events: none; }`
- Results: always rendered, gets class `results-visible` when results shown. CSS: `opacity: 0; transform: translateY(20px); .results-visible { opacity: 1; transform: translateY(0); }` with entry animation via `@keyframes`

### 2. Search bar transitions on existing class toggle

**Chosen: Add `transition` property to `.search-bar` for the properties changed by `.search-console-compact`.**

The class toggle already works. We just add:
```css
.search-bar {
  transition: min-height 0.4s ease, max-width 0.4s ease, padding 0.4s ease, box-shadow 0.4s ease;
}
.search-bar input {
  transition: font-size 0.4s ease;
}
.search-bar .primary-gradient-button {
  transition: min-height 0.4s ease, padding 0.4s ease, font-size 0.4s ease;
}
```

### 3. Platform card collapse with max-height

**Chosen: CSS `max-height` + `opacity` transition on group content, selected-chips row appears on collapse.**

The card has two visual layers:
- **Expanded state**: Full group accordion visible. Selected-chips row hidden (`display: none`).
- **Collapsed state**: All group accordions hidden (`max-height: 0; opacity: 0; overflow: hidden`). Selected-chips row visible with expand button.

The expand/collapse is driven by a `collapsed` prop on SourcePicker. CSS handles all visual transitions.

### 4. Card placement between search bar and results

**Chosen: Card sits in the current `search-options-line` position, always between search bar and results.**

When collapsed, the card is a thin row of chip badges + expand button, taking minimal vertical space above the results table.

## Risks / Trade-offs

- **Keep-in-DOM means hero is always mounted** → Renders invisible text that screen readers might pick up. Mitigation: `aria-hidden="true"` when hidden.
- **`max-height` transition needs a known max** → The card content height varies by platform count. Mitigation: set `max-height` to a generous value (e.g., 800px) so the transition always covers the full content.
- **Results panel mounted but empty initially** → The empty results panel shows "no results" state briefly. Mitigation: only show the panel when `hasSearched` is true (results panel already handles the empty/loading/no-result states internally).
