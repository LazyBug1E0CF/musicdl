## ADDED Requirements

### Requirement: Volume bar controls audio volume

The bottom player SHALL provide an interactive volume bar that allows users to set the playback volume by clicking or dragging on the bar.

#### Scenario: Click volume bar to set volume

- **WHEN** the user clicks a position on the volume bar
- **THEN** the audio element's volume is set to the corresponding level (0 to 1) and the bar visually reflects the new volume

#### Scenario: Drag volume bar to adjust volume

- **WHEN** the user presses and drags along the volume bar
- **THEN** the audio element's volume tracks the cursor position continuously during the drag

#### Scenario: Volume persists across track changes

- **WHEN** playback switches to a different track
- **THEN** the previously set volume level is preserved

### Requirement: Volume icon toggles mute on wide screens

On viewports wider than 1080px, the volume icon button SHALL toggle between muted and the previous volume level on click. On viewports 1080px or narrower the icon instead opens the volume popup — matching the breakpoint where the horizontal volume bar is hidden.

#### Scenario: Mute and unmute on wide screen

- **WHEN** the user clicks the volume icon while audio is playing at a non-zero volume on a wide viewport
- **THEN** the audio is muted and the icon shows a muted state

- **WHEN** the user clicks the volume icon again
- **THEN** the audio volume is restored to the level before muting and the icon shows the normal state

### Requirement: Volume control adapts to narrow viewports

On viewports 1080px or narrower — matching the breakpoint where the horizontal volume bar is hidden — the bottom player SHALL switch the volume icon to a popup-triggering button. Clicking the icon SHALL open a vertical volume popup slider.

#### Scenario: Narrow screen shows popup icon after bar is hidden

- **WHEN** the viewport width is 1080px or less
- **THEN** the volume bar is hidden and the volume icon switches from mute-toggle to popup-trigger mode

#### Scenario: Click icon opens volume popup on narrow screen

- **WHEN** the user clicks the volume icon on a viewport where the bar is hidden
- **THEN** a vertical volume slider popup appears adjacent to the icon, allowing the user to adjust volume

#### Scenario: Click outside popup dismisses it

- **WHEN** the volume popup is open and the user clicks anywhere outside the popup and its trigger icon
- **THEN** the popup closes

### Requirement: Progress bar reorders above controls on narrow viewports

On viewports 780px or narrower, the progress bar SHALL render visually above the playback control buttons.

#### Scenario: Progress bar above controls on narrow screen

- **WHEN** the viewport width is 780px or less
- **THEN** the progress bar occupies the first grid row and the playback controls are in the second grid row
