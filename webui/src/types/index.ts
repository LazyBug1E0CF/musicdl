export interface SearchParams {
  keyword: string;
  sources: string[];
  category: SearchCategory;
}

export type AppView = 'search' | 'settings';

export type SearchCategory = 'song' | 'album' | 'artist';

export type DownloadMode = 'server' | 'browser';

export type DownloadFilenameFormat = 'artist-title' | 'title-artist';

export interface WebUISettings {
  sourceCookies: Record<string, string>;
  activeCookieSource: string;
  downloadMode: DownloadMode;
  autoImportToLibrary: boolean;
  maxResults?: number;
  downloadFilenameFormat: DownloadFilenameFormat;
}

export interface RequestSettings {
  sourceCookies: Record<string, string>;
  downloadFilenameFormat?: DownloadFilenameFormat;
}

export interface SourcePagingState {
  offset: number;
  page: number;
  exhausted: boolean;
}

export interface RawSongInfo {
  raw_data?: Record<string, unknown>;
  source?: string;
  root_source?: string;
  song_name?: string;
  singers?: string;
  album?: string;
  ext?: string;
  duration?: string;
  duration_s?: number;
  file_size?: string;
  file_size_bytes?: number;
  bitrate?: number;
  codec?: string;
  samplerate?: number;
  channels?: number;
  lyric?: string;
  cover_url?: string;
  download_url?: unknown;
  download_url_status?: Record<string, unknown>;
  default_download_headers?: Record<string, unknown>;
  default_download_cookies?: Record<string, unknown>;
  protocol?: string;
  work_dir?: string;
  identifier?: string | number;
  save_path?: string;
  episodes?: RawSongInfo[];
}

export type BitrateKind = 'exact' | 'estimated' | 'fallback';

export type BitrateTier = 'tier-1' | 'tier-2' | 'tier-3' | 'tier-4' | 'tier-5' | 'unknown';

export type FormatTone = 'lossless' | 'mp3' | 'aac' | 'opus' | 'wave' | 'default';

export interface SongResult {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  source: string;
  format: string;
  formatTone: FormatTone;
  bitrate: string;
  bitrateKind: BitrateKind;
  bitrateTier: BitrateTier;
  bitrateKbps?: number;
  fileSize: string;
  raw: RawSongInfo;
}

export interface TaskArtifact {
  relative_path: string;
  filename: string;
  size: number;
  download_url?: string;
}

export type DownloadStatus = 'pending' | 'running' | 'success' | 'failed';

export interface DownloadTask {
  task_id: string;
  title: string;
  status: DownloadStatus;
  total: number;
  completed: number;
  failed: number;
  progress: number;
  logs: string[];
  artifacts: TaskArtifact[];
  error?: unknown;
  serverPath?: string;
}

export interface SourceOption {
  value: string;
  label: string;
}
