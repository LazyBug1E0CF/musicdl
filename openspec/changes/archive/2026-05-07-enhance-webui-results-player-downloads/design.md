## Context

The WebUI currently supports search, playback, download tasks, settings, and cookie overrides. Search still exposes a main-page result count input, and playback delegates control UI to the browser's native `<audio controls>`. The requested change moves result limits into settings, makes results load progressively, and turns the bottom player into a queue-aware custom music player.

The existing WebAPI supports repeated search calls with `overrides.search_rules`; source clients such as Netease and QQ can accept offset/page rules. The implementation can use repeated backend searches to emulate paging without replacing the core musicdl search engine.

## Goals / Non-Goals

**Goals:**
- Remove the main-page result quantity setting.
- Load result batches on scroll until every selected source is exhausted or the configured maximum is reached.
- Default the maximum result setting to selected source count multiplied by 5 when the user has not explicitly configured one.
- Implement a custom bottom player matching the sample direction with previous/next, play/pause, seekable progress, time display, current track, and expandable playlist.
- Maintain a queue based on search results and allow direct playlist selection.
- Add a filename format setting and apply it to server-side and browser-direct downloads.

**Non-Goals:**
- Replacing the core musicdl search implementation with a true cursor API for every source.
- Guaranteeing infinite results from sources that do not support paging or offsets.
- Implementing advanced player features such as shuffle, repeat, waveform, lyrics sync, crossfade, or media session integrations.
- Adding server-side user profiles or cloud-synced preferences.

## Decisions

1. **Use client-orchestrated incremental search batches.**
   - The WebUI will maintain `nextOffset`/page metadata per source and request additional batches through existing `/api/v1/search`.
   - Netease-style sources can receive `offset`; QQ-style sources can receive `page_num`; unsupported sources can receive bounded repeated batch requests and be marked exhausted once a batch returns no new deduped rows.
   - Rationale: avoids a breaking API redesign while still giving the user infinite-scroll behavior.
   - Alternative considered: add a new `/api/v1/search/page` endpoint with explicit cursors. This is cleaner long term but requires a broader backend contract and source adapter audit.

2. **Move max result configuration to settings with a computed default.**
   - `maxResults` will be optional in persisted settings. If absent, the effective cap is `selectedSources.length * 5`.
   - Rationale: matches the requested default while adapting to the user's selected platform count.
   - The main search page will no longer expose an `InputNumber` for result quantity.

3. **Use a hidden audio element controlled by React state instead of native browser controls.**
   - The `<audio>` element remains responsible for media playback, buffering, duration, and time events, but it will not render native controls.
   - React state will drive the custom UI: `playing`, `duration`, `currentTime`, `buffering/error`, `queue`, `currentIndex`, and `playlistOpen`.
   - Rationale: preserves browser media reliability while meeting the visual/control requirements.

4. **Search results become the playback queue.**
   - Successful search results populate or refresh the player queue.
   - Clicking play selects the corresponding queue item and resolves playback if needed.
   - Previous/next navigates within the current queue; selecting from the expanded playlist directly changes the current index.
   - Rationale: a queue follows natural music-app expectations and allows player controls to remain independent of the result list.

5. **Represent filename preference as a typed setting and send it with download requests.**
   - Add `downloadFilenameFormat: 'artist-title' | 'title-artist'` to WebUI settings.
   - Browser-direct downloads use the generated filename in the anchor `download` attribute.
   - Server-side downloads pass the chosen format in the download payload or a backend-supported override. The WebAPI will convert it into a safe target filename before invoking musicdl download.
   - Rationale: the server controls the final saved artifact path, so server downloads need backend participation.

## Risks / Trade-offs

- **Repeated search calls may return duplicates** -> Deduplicate by source and identifier before appending, and treat duplicate-only batches as exhausted after a small retry budget.
- **Some sources may not support offset/page rules** -> Keep source-specific pagination best-effort and stop when no new rows appear.
- **Custom player can drift from audio state** -> Make the audio element the source of truth for time/duration and update React state from audio events.
- **Browser-direct `download` filename may be ignored cross-origin** -> Still set the attribute, and rely on server-side mode for guaranteed local filenames.
- **Filename characters may be illegal on the host filesystem** -> Sanitize on the WebAPI before constructing `save_path`; keep frontend sanitization only as a browser-download convenience.
- **Large queues can affect layout on mobile** -> Limit playlist panel height, virtualize or scroll playlist items, and keep bottom player controls stable.

## Migration Plan

1. Add settings fields for optional `maxResults` and `downloadFilenameFormat`, with defaults during hydration.
2. Remove the result limit control from the main search page and replace search state with incremental loading metadata.
3. Extend the API client to fetch batches, append/dedupe results, and expose `hasMore`/`loadingMore` state.
4. Replace the native bottom player with custom player controls backed by a hidden audio element.
5. Add filename-format handling to browser-direct and server-side download payloads.
6. Update styles, localization, and browser smoke tests for infinite scroll, custom player controls, playlist expansion, and filename preferences.

Rollback: restore the current fixed-result search flow, native audio controls, and default download payloads. Existing saved settings should tolerate missing new fields through default hydration.
