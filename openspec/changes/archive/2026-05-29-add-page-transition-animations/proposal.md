## Why

The page currently has an abrupt, jarring transition between the initial hero state and the search results state — elements instantly disappear, resize, and appear with no visual continuity. Adding smooth CSS transitions and animations will make the interface feel polished, responsive, and professional.

## What Changes

- **Search bar transition**: Smoothly shrink and move up when search results appear, using CSS `transition` on `min-height`, `max-width`, `padding`
- **Hero exit animation**: Fade out and slide up the hero copy when transitioning to results, using CSS opacity/transform transitions triggered by class toggle
- **Results entrance animation**: Fade in and slide up the result panel on first appearance, using CSS `@keyframes`
- **Platform picker card**: Wrap the source picker in a card container. Initially fully expanded showing all groups. After search executes, collapse into a compact row showing only selected platform chips plus an expand button. Use CSS `max-height` + `opacity` transitions for the collapse/expand effect
- **Keep-in-DOM strategy**: Instead of conditionally rendering hero and results, keep both in the DOM permanently and control visibility via CSS classes — this enables both enter and exit animations without a JS animation library

## Capabilities

### New Capabilities

- `page-transition-animations`: Smooth visual transitions between the initial hero/search state and the search-results state, including search bar morphing, hero exit, results entrance, and platform picker collapse/expand.

### Modified Capabilities

<!-- None -->

## Impact

- **webui/src/pages/SearchPage.tsx**: Replace conditional rendering with class-toggled visibility for hero and result sections; pass `collapsed` state to SourcePicker
- **webui/src/components/SourcePicker.tsx**: Add collapsed mode rendering (selected chips row + expand button)
- **webui/src/styles.css**: Add CSS transitions, keyframes, card styles, collapsed-mode styles
- No new dependencies (pure CSS, no framer-motion)
- No backend changes
