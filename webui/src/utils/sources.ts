import type { SourceOption } from '../types';

const SOURCE_META: Record<string, { short: string; color: string; label?: string }> = {
  NeteaseMusicClient: { short: 'N', color: '#e60012', label: '网易云音乐' },
  QQMusicClient: { short: 'Q', color: '#18c463', label: 'QQ音乐' },
  KugouMusicClient: { short: 'K', color: '#2577ff', label: '酷狗音乐' },
  KuwoMusicClient: { short: 'W', color: '#ff9f1c', label: '酷我音乐' },
  MiguMusicClient: { short: 'M', color: '#f6296b', label: '咪咕音乐' },
  SpotifyMusicClient: { short: 'S', color: '#1db954', label: 'Spotify' },
  AppleMusicClient: { short: 'A', color: '#ff375f', label: 'Apple Music' },
  YouTubeMusicClient: { short: 'Y', color: '#ff0000', label: 'YouTube' },
  SoundCloudMusicClient: { short: 'S', color: '#ff5500', label: 'SoundCloud' },
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

export const SOURCE_CATEGORIES: Record<string, { name: string; platforms: string[] }> = {
  greater_china: {
    name: '大中华区',
    platforms: [
      'QQMusicClient', 'KugouMusicClient', 'NeteaseMusicClient', 'KuwoMusicClient',
      'MiguMusicClient', 'QianqianMusicClient', 'StreetVoiceMusicClient', 'SodaMusicClient',
      'FiveSingMusicClient', 'BilibiliMusicClient', 'BodianMusicClient', 'MOOVMusicClient',
    ],
  },
  global: {
    name: '全球流媒体',
    platforms: [
      'YouTubeMusicClient', 'JooxMusicClient', 'AppleMusicClient', 'JamendoMusicClient',
      'SoundCloudMusicClient', 'DeezerMusicClient', 'QobuzMusicClient', 'SpotifyMusicClient',
      'TIDALMusicClient', 'FMAMusicClient', 'JioSaavnMusicClient', 'OpenGameArtMusicClient',
      'SunoMusicClient',
    ],
  },
  aggregators: {
    name: '聚合站',
    platforms: [
      'MP3JuiceMusicClient', 'TuneHubMusicClient', 'GDStudioMusicClient',
      'MyFreeMP3MusicClient', 'JBSouMusicClient', 'WJHEMusicClient',
    ],
  },
};

export type SourceCategoryKey = keyof typeof SOURCE_CATEGORIES;

export interface SourceGroup {
  key: SourceCategoryKey;
  name: string;
  options: SourceOption[];
}

export function groupSourceOptions(options: SourceOption[]): SourceGroup[] {
  const byValue = new Map(options.map((option) => [option.value, option]));
  const categoryOrder: SourceCategoryKey[] = ['greater_china', 'global', 'aggregators'];

  return categoryOrder
    .map((key) => {
      const cat = SOURCE_CATEGORIES[key];
      return {
        key,
        name: cat.name,
        options: cat.platforms
          .filter((platform) => byValue.has(platform))
          .map((platform) => byValue.get(platform)!),
      };
    })
    .filter((group) => group.options.length > 0);
}

export function preferredSourceOptions(options: SourceOption[]): SourceOption[] {
  const byValue = new Map(options.map((option) => [option.value, option]));
  const flatPlatforms = [
    ...SOURCE_CATEGORIES.greater_china.platforms,
    ...SOURCE_CATEGORIES.global.platforms,
    ...SOURCE_CATEGORIES.aggregators.platforms,
  ];
  const ordered = flatPlatforms.filter((source) => byValue.has(source)).map((source) => byValue.get(source)!);
  return ordered.length > 0 ? ordered : options.slice(0, 7);
}
