import type { DownloadFilenameFormat, SongResult } from '../types';

const FALLBACK_EXT = 'audio';
const INVALID_FILENAME_CHARS = /[<>:"/\\|?*\u0000-\u001f]+/g;

function metadataValue(value?: string | number | null): string {
  const text = String(value ?? '').trim();
  return text && !['-', 'NULL', 'null', 'None', 'none', 'undefined'].includes(text) ? text : '';
}

export function sanitizeDownloadFilename(name: string): string {
  return name.replace(INVALID_FILENAME_CHARS, '_').replace(/\s+/g, ' ').replace(/[. ]+$/g, '').trim().slice(0, 180) || 'download';
}

export function extensionForSong(song: SongResult): string {
  const rawExt = metadataValue(song.raw.ext || song.format).replace(/^\./, '').toLowerCase();
  if (!rawExt || rawExt === '-') return FALLBACK_EXT;
  return rawExt.replace(/[^a-z0-9]+/g, '') || FALLBACK_EXT;
}

export function formatDownloadFilename(song: SongResult, format: DownloadFilenameFormat = 'artist-title'): string {
  const title = metadataValue(song.title || song.raw.song_name);
  const artist = metadataValue(song.artist || song.raw.singers);
  const identifier = metadataValue(song.raw.identifier);
  const source = metadataValue(song.source || song.raw.source);
  const parts =
    artist && title
      ? format === 'title-artist'
        ? [title, artist]
        : [artist, title]
      : [title || artist || identifier || source || 'download'];
  return `${sanitizeDownloadFilename(parts.join('-'))}.${extensionForSong(song)}`;
}
