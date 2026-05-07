import type { BitrateKind, BitrateTier, FormatTone, RawSongInfo } from '../types';

interface BitrateMetadata {
  label: string;
  kind: BitrateKind;
  tier: BitrateTier;
  value?: number;
}

function positiveNumber(value: unknown): number | undefined {
  const numberValue = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : undefined;
}

function parseFileSizeBytes(value: unknown): number | undefined {
  if (typeof value !== 'string') return undefined;
  const match = value.trim().match(/^([0-9]+(?:\.[0-9]+)?)\s*(b|kb|kib|mb|mib|gb|gib)?$/i);
  if (!match) return undefined;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return undefined;
  const unit = (match[2] || 'b').toLowerCase();
  const multiplier =
    unit === 'gb' || unit === 'gib'
      ? 1024 * 1024 * 1024
      : unit === 'mb' || unit === 'mib'
        ? 1024 * 1024
        : unit === 'kb' || unit === 'kib'
          ? 1024
          : 1;
  return amount * multiplier;
}

function parseDurationSeconds(value: unknown): number | undefined {
  if (typeof value !== 'string') return undefined;
  const parts = value
    .trim()
    .split(':')
    .map((part) => Number(part));
  if (parts.length < 2 || parts.length > 3 || parts.some((part) => !Number.isFinite(part) || part < 0)) return undefined;
  const [hours, minutes, seconds] = parts.length === 3 ? parts : [0, parts[0], parts[1]];
  const total = hours * 3600 + minutes * 60 + seconds;
  return total > 0 ? total : undefined;
}

export function estimateBitrateKbps(song: Pick<RawSongInfo, 'file_size' | 'file_size_bytes' | 'duration' | 'duration_s'>): number | undefined {
  const fileSizeBytes = positiveNumber(song.file_size_bytes) || parseFileSizeBytes(song.file_size);
  const durationSeconds = positiveNumber(song.duration_s) || parseDurationSeconds(song.duration);
  if (!fileSizeBytes || !durationSeconds) return undefined;
  const estimated = Math.round((fileSizeBytes * 8) / durationSeconds / 1000);
  return estimated > 0 ? estimated : undefined;
}

export function getBitrateTier(value?: number): BitrateTier {
  if (!value || !Number.isFinite(value) || value <= 0) return 'unknown';
  if (value < 128) return 'tier-1';
  if (value < 192) return 'tier-2';
  if (value < 256) return 'tier-3';
  if (value < 320) return 'tier-4';
  return 'tier-5';
}

export function buildBitrateMetadata(song: RawSongInfo): BitrateMetadata {
  const exactBitrate = positiveNumber(song.bitrate);
  if (exactBitrate) {
    const rounded = Math.round(exactBitrate);
    return {
      label: `${rounded} kbps`,
      kind: 'exact',
      tier: getBitrateTier(rounded),
      value: rounded,
    };
  }

  const estimatedBitrate = estimateBitrateKbps(song);
  if (estimatedBitrate) {
    return {
      label: `~${estimatedBitrate} kbps`,
      kind: 'estimated',
      tier: getBitrateTier(estimatedBitrate),
      value: estimatedBitrate,
    };
  }

  return {
    label: song.codec || '-',
    kind: 'fallback',
    tier: 'unknown',
  };
}

export function getFormatTone(format?: string): FormatTone {
  const normalized = (format || '').trim().replace(/^\./, '').toLowerCase();
  if (['flac', 'alac', 'ape', 'dsf', 'dff'].includes(normalized)) return 'lossless';
  if (normalized === 'mp3') return 'mp3';
  if (['m4a', 'aac', 'mp4', 'weba'].includes(normalized)) return 'aac';
  if (['ogg', 'opus', 'oga', 'vorbis', 'webm'].includes(normalized)) return 'opus';
  if (['wav', 'wave', 'aif', 'aiff'].includes(normalized)) return 'wave';
  return 'default';
}

export function formatTagClassName(tone: FormatTone): string {
  return `metadata-tag metadata-tag-format metadata-tag-format-${tone}`;
}

export function bitrateTagClassName(tier: BitrateTier, kind: BitrateKind): string {
  const classes = ['metadata-tag', 'metadata-tag-bitrate', `metadata-tag-bitrate-${tier}`];
  if (kind === 'estimated') classes.push('metadata-tag-estimated');
  if (kind === 'fallback') classes.push('metadata-tag-bitrate-fallback');
  return classes.join(' ');
}
