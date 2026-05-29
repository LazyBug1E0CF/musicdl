## ADDED Requirements

### Requirement: Search bar transitions smoothly on state change

When transitioning from the initial hero state to the search-results state, the search bar SHALL animate its size change smoothly using CSS transitions rather than changing instantly.

#### Scenario: Search executes and bar shrinks

- **WHEN** the user triggers a search and results begin loading
- **THEN** the search bar's min-height transitions from 116px to 58px over ~0.4s
- **AND** the search bar's max-width transitions to 760px over ~0.4s
- **AND** the search bar's horizontal padding transitions smoothly
- **AND** the input font-size transitions from clamp(22px,2vw,32px) to 19px over ~0.4s
- **AND** the search button min-height, padding, and font-size transition over ~0.4s

#### Scenario: User clears results and returns to hero

- **WHEN** the user navigates back to the initial state (e.g., by clearing search)
- **THEN** the search bar transitions back to its full-size state over ~0.4s

### Requirement: Hero section fades out on search

The hero copy (title and subtitle) SHALL animate out when search results appear, rather than disappearing instantly.

#### Scenario: Hero fades out and slides up

- **WHEN** the application transitions from initial state to search-results state
- **THEN** the hero section's opacity transitions to 0 over ~0.3s
- **AND** the hero section translates upward by ~20px over ~0.3s
- **AND** the hero section is hidden from screen readers via aria-hidden when invisible

### Requirement: Results panel animates in on first appearance

The results panel SHALL animate in when search results first appear, rather than appearing instantly.

#### Scenario: Results panel fades in and slides up

- **WHEN** the application transitions from initial state to search-results state
- **THEN** the results panel fades in from opacity 0 to 1 over ~0.3s
- **AND** the results panel slides up from a ~20px downward offset to its final position over ~0.3s
- **AND** the animation triggers each time results first appear (not on subsequent load-more operations)

### Requirement: Platform picker card with collapse/expand

The platform source picker SHALL be contained in a visual card. The card SHALL start fully expanded on page load and collapse to a compact row after a search is executed, showing only the currently selected platforms.

#### Scenario: Card is fully expanded on page load

- **WHEN** the search page first loads
- **THEN** the platform picker card displays all three category groups expanded (same as current SourcePicker behavior)
- **AND** the card has visible border, background, and rounded corners

#### Scenario: Card collapses after search

- **WHEN** the user executes a search
- **THEN** the card transitions to a compact state: all category groups collapse (max-height → 0, opacity → 0) over ~0.35s
- **AND** a row of selected platform chips appears with an "expand" button
- **AND** the collapse transition is driven by CSS max-height and opacity transitions
- **AND** no framer-motion or JS animation library is used

#### Scenario: User expands card from collapsed state

- **WHEN** the user clicks the expand button in the collapsed card
- **THEN** the category groups expand back (max-height → full, opacity → 1) over ~0.35s
- **AND** all chips remain interactive for selection/deselection
- **AND** the selected-chips row hides while expanded

#### Scenario: Search button disabled state preserved in collapsed card

- **WHEN** all platforms are deselected (in either expanded or collapsed state)
- **THEN** the search button remains disabled (grayed out)
- **AND** the behavior matches the existing empty-sources guard
