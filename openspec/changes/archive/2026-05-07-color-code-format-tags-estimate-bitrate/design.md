## Context

The WebUI already receives `bitrate`, `file_size_bytes`, `duration_s`, `file_size`, `duration`, `codec`, and `ext` in search result payloads. The result list change `result-format-tags-file-size-column` separates format, bitrate, and file size visually, but it does not define quality color semantics or fill missing bitrate values.

Search-stage bitrate is sparse because most source adapters populate file size and duration but do not probe downloaded audio metadata until the download completes. Since the WebUI already has enough data to estimate average bitrate in many search results, this change can improve scanability without changing the backend contract.

## Goals / Non-Goals

**Goals:**

- Color-code format tags with distinct styles for common audio formats.
- Color-code bitrate tags by quality tier from green through gold, with gold reserved for the highest tier.
- Estimate missing bitrate from file size and duration when both values are usable.
- Clearly distinguish estimated bitrate from exact source-provided or probed bitrate.
- Preserve complete tag text and wrapping behavior introduced by the result format/file-size column change.

**Non-Goals:**

- Do not add audio probing during search requests.
- Do not change core `SongInfo` or WebAPI schema fields.
- Do not infer lossless quality only from container format.
- Do not replace download-time TinyTag metadata supplementation.

## Decisions

1. **Estimate bitrate in the WebUI normalization layer.**

   `webui/src/api/client.ts` will derive the displayed bitrate from `song.bitrate` when present. If it is absent, it will estimate `Math.round(file_size_bytes * 8 / duration_s / 1000)` when both values are positive finite numbers.

   Rationale: the WebUI has the source payload at the point it creates `SongResult`, and this avoids backend/API changes. It also keeps estimated display behavior local to the search result UI.

   Alternative considered: add backend-derived bitrate to `SongInfo`. That would be useful later, but it changes core semantics and may affect CLI/API consumers who expect `bitrate` to mean measured or source-provided metadata.

2. **Keep exact and estimated bitrate state separate.**

   `SongResult` should carry a small state such as `bitrateKind: "exact" | "estimated" | "fallback"`, while the displayed label can remain a string. Estimated labels should include an approximation marker such as `~192 kbps`.

   Rationale: styling and accessibility need to know whether the value is exact or estimated without parsing the visible string.

   Alternative considered: append `(estimated)` in visible text. That is clearer but too bulky for compact result tags.

3. **Use deterministic quality tiers for bitrate color.**

   Suggested tiers:

   - `tier-1`: less than 128 kbps, green
   - `tier-2`: 128 to 191 kbps, yellow-green
   - `tier-3`: 192 to 255 kbps, amber
   - `tier-4`: 256 to 319 kbps, orange-gold
   - `tier-5`: 320 kbps and above, gold

   Rationale: these thresholds match familiar lossy audio quality steps and provide a clear green-to-gold progression. Estimated bitrate uses the same tier scale but should include a visual distinction such as a softer border or dashed outline.

   Alternative considered: continuous HSL interpolation. Fixed tiers are easier to test, document, and keep visually stable.

4. **Use format-specific colors independent from bitrate tiers.**

   Common formats should map to stable colors, for example FLAC/ALAC in cool blue, MP3 in violet, M4A/AAC in teal, OGG/OPUS in rose, WAV/AIFF in neutral indigo, and unknown formats in neutral gray.

   Rationale: format and bitrate express different metadata dimensions. Keeping their palettes separate prevents a high-bitrate MP3 and a FLAC format tag from implying the same thing.

   Alternative considered: color format tags by quality as well. That would blur format identity with bitrate quality and could mislead for lossless formats where average bitrate varies by content.

## Risks / Trade-offs

- **Estimated bitrate may not match encoded nominal bitrate.** -> Mark estimated labels with an approximation symbol and keep exact/estimated state separate.
- **Container overhead and embedded metadata can skew estimates.** -> Treat the value as a display hint only and avoid writing it back to raw song metadata.
- **Duration or size may be unavailable or invalid.** -> Fall back to codec or `-` without producing a misleading estimate.
- **Color-only meaning can reduce accessibility.** -> Preserve readable text, use sufficient contrast, and expose exact/estimated state through accessible labels or titles.
- **Active result-list change touches the same files.** -> Apply or archive `result-format-tags-file-size-column` first, then layer this change on top of its tag structure.
