## Context

The WebUI is a React + TypeScript + Ant Design + Zustand application served by Vite in development and Nginx in Docker. It currently uses the WebAPI for source discovery, search, playback resolution, download task creation, task polling/SSE, and artifact download. The requested redesign is visually driven by `webui/ui-sample/index.png`, `result.png`, and `settings.png`, with the explicit change that the main/search/result views must not include the top navigation bar from the samples.

The current WebAPI already accepts `overrides.init_music_clients_cfg` and `overrides.requests_overrides`, so per-platform cookies can be applied without a breaking API change. The primary implementation question is how to store and transmit sensitive cookie values from the settings UI.

## Goals / Non-Goals

**Goals:**
- Replace the utilitarian table-first UI with a music-search experience matching the provided light, soft-gradient, glass-panel visual direction.
- Keep the main page focused on search: large keyword input, category tabs, platform multi-select, results list, persistent bottom player, and a top-right settings icon button.
- Add a settings page matching the provided settings sample, with per-platform cookie editing and default download behavior controls.
- Apply saved cookies to search, playback fallback resolution, playlist parsing if exposed later, and download task creation.
- Preserve current search/play/download functionality and task progress behavior.
- Keep the UI usable at desktop and mobile widths.

**Non-Goals:**
- Implement account login, cookie acquisition, QR login, or credential scraping flows.
- Add the sample's unrelated top navigation, membership CTA, profile menu, rankings, marketplace, singer, or MV pages.
- Guarantee that cookies unlock high-quality audio on every platform.
- Persist cookies on the server unless a later implementation explicitly chooses a server-managed secret store.

## Decisions

1. **Use a single React application with lightweight page state instead of adding a router dependency.**
   - Rationale: the app only needs `search` and `settings` views, and the current dependency set does not include a router.
   - Alternative considered: add React Router. This is unnecessary unless deep links, nested pages, or browser history semantics become required.

2. **Persist user WebUI settings in browser localStorage.**
   - Rationale: avoids introducing server-side secret storage, migrations, authentication, or multi-user isolation concerns.
   - Alternative considered: store cookies in WebAPI environment variables or a server file. That is safer for shared deployments but less aligned with the user's request that users set cookies in the page.
   - Implementation note: cookies must be treated as sensitive UI settings and excluded from logs, toasts, visible summaries, task logs, and exported debug output.

3. **Represent cookie settings as per-source raw cookie strings plus parsed objects when sending requests.**
   - Rationale: users usually copy browser cookie headers as semicolon-delimited strings, while the core library can consume dict cookies through `default_search_cookies`, `default_download_cookies`, and `default_parse_cookies`.
   - Alternative considered: require JSON cookie maps. That is less convenient for users and more error-prone.

4. **Map settings into existing WebAPI `overrides` payloads.**
   - Rationale: current schemas already support per-source `init_music_clients_cfg` and `requests_overrides`, so no breaking endpoint changes are needed.
   - Search requests will include per-source `default_search_cookies`; download requests will include `default_download_cookies`; playback fallback resolution may require a small request schema extension if it must resolve without a fully resolved `song_info`.

5. **Keep download modes explicit but compatible with current task artifacts.**
   - Server media library mode uses existing `/api/v1/download`, task SSE, and artifact endpoints.
   - Browser direct mode uses an existing resolved `download_url` or playback resolution when available, and falls back to server task artifacts when direct download is not possible.
   - Auto-import applies only to server media library mode and means the completed server-side artifact remains registered and visible in the download queue.

6. **Use visual assets from the sample direction as CSS/background treatment rather than introducing a heavy image pipeline.**
   - Rationale: the sample relies on a soft music-themed background, glass panels, source badges, and a bottom player. These can be implemented with CSS and small icon assets/library icons.
   - Alternative considered: make the sample images themselves page backgrounds. That would not adapt well to content, localization, or responsive layouts.

## Risks / Trade-offs

- **Cookie exposure in browser storage** -> Warn users in the settings UI that cookies are stored locally in this browser and sent only to the configured WebAPI. Avoid rendering full cookie values outside the editor.
- **Some platforms require special tokens rather than generic cookies** -> Keep the settings model source-specific and allow advanced raw cookies; document that platform requirements vary.
- **High-quality search can be slow with more platforms/cookies** -> Preserve source multi-select, result limit, per-source search size limits, loading states, and error presentation.
- **Browser direct download may fail for protected or expiring URLs** -> Fall back to server download tasks and show clear failure states.
- **Sample visual density may not fit mobile** -> Use responsive layout rules: stack controls, make the result list horizontally safe or card-like on narrow screens, and keep the player fixed without covering actionable controls.

## Migration Plan

1. Add a typed settings model and localStorage persistence with defaults.
2. Refactor the current single `App.tsx` into page and reusable component modules.
3. Implement the redesigned search/results page while keeping the current API client behavior operational.
4. Implement settings page and wire cookies/download defaults into request payload builders.
5. Validate with `npm run build`, Docker build, and browser checks for index, results, settings, playback, and download flows.

Rollback is straightforward: revert the WebUI changes and keep the WebAPI-compatible request contract unchanged.

## Open Questions

- Should cookie values ever be encrypted at rest in localStorage, or is local browser storage acceptable for the first implementation?
- Should the settings page expose only cookies initially, or also platform-specific token labels for services such as Qobuz, TIDAL, SoundCloud, and Qingting?
- Should browser direct download create any task entry for visibility, or should it remain independent of the download queue?
