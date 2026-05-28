## 1. Update platform metadata in sources.ts

- [x] 1.1 Add 2 SOURCE_META overrides for incorrect fallback names: YouTubeMusicClient (`YouTube`), SoundCloudMusicClient (`SoundCloud`). Note: AppleMusicClient already had a correct label pre-existing in SOURCE_META.
- [x] 1.2 Add `SOURCE_CATEGORIES` constant mapping each platform to its category group with display order: Greater China (12), Global Streaming (13), Aggregators (6)
- [x] 1.3 Replace `preferredSourceOptions()` body to return all 31 platforms grouped by category, ordered by the category sequence defined in SOURCE_CATEGORIES

## 2. Add grouped accordion rendering to SourcePicker

- [x] 2.1 Add a `SourceGroup` sub-component that renders a collapsible section with a category header and platform chips, using local state for expanded/collapsed (default expanded)
- [x] 2.2 Refactor SourcePicker to iterate over groups (derived from SOURCE_CATEGORIES) and render one `SourceGroup` per category

## 3. Verify and type-check

- [x] 3.1 Run `npm run build` (or `npx tsc --noEmit`) to verify no TypeScript errors
- [x] 3.2 Manually verify in dev server: all 31 platforms appear, groups collapse/expand, selection and search work across newly-visible platforms
