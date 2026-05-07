import type { SourceOption } from '../types';

const SOURCE_META: Record<string, { short: string; color: string; label?: string }> = {
  NeteaseMusicClient: { short: 'N', color: '#e60012', label: '网易云音乐' },
  QQMusicClient: { short: 'Q', color: '#18c463', label: 'QQ音乐' },
  KugouMusicClient: { short: 'K', color: '#2577ff', label: '酷狗音乐' },
  KuwoMusicClient: { short: 'W', color: '#ff9f1c', label: '酷我音乐' },
  MiguMusicClient: { short: 'M', color: '#f6296b', label: '咪咕音乐' },
  SpotifyMusicClient: { short: 'S', color: '#1db954', label: 'Spotify' },
  AppleMusicClient: { short: 'A', color: '#ff375f', label: 'Apple Music' },
};

export function displaySource(source?: string): string {
  if (!source) return '';
  return (
    SOURCE_META[source]?.label ||
    source
      .replace(/MusicClient$/, '')
      .replace(/^TIDAL$/, 'Tidal')
      .replace(/^QQ$/, 'QQ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
  );
}

export function sourceInitial(source: string): string {
  return SOURCE_META[source]?.short || displaySource(source).slice(0, 1).toUpperCase();
}

export function sourceColor(source: string): string {
  return SOURCE_META[source]?.color || '#6258f4';
}

export function preferredSourceOptions(options: SourceOption[]): SourceOption[] {
  const preferred = ['NeteaseMusicClient', 'QQMusicClient', 'KugouMusicClient', 'KuwoMusicClient', 'MiguMusicClient', 'SpotifyMusicClient', 'AppleMusicClient'];
  const byValue = new Map(options.map((option) => [option.value, option]));
  const ordered = preferred.filter((source) => byValue.has(source)).map((source) => byValue.get(source)!);
  return ordered.length > 0 ? ordered : options.slice(0, 7);
}
