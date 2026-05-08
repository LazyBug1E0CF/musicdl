import type {
  DownloadFilenameFormat,
  DownloadTask,
  RawSongInfo,
  RequestSettings,
  SearchCategory,
  SearchParams,
  SongResult,
  SourceOption,
  SourcePagingState,
  TaskArtifact,
} from '../types';
import { parseCookieString } from '../utils/cookies';
import { buildBitrateMetadata, getFormatTone } from '../utils/resultMetadata';
import { displaySource } from '../utils/sources';

interface SearchResponse {
  results: Record<string, RawSongInfo[]>;
}

interface TaskResponse {
  task_id: string;
  status: DownloadTask['status'];
  total?: number;
  completed?: number;
  failed?: number;
  logs?: string[];
  artifacts?: TaskArtifact[];
  result?: unknown;
  error?: unknown;
}

interface PlaybackResponse {
  stream_url: string;
  mime_type: string;
  expires_at: string;
}

export const SEARCH_BATCH_SIZE_PER_SOURCE = 2;
const SEARCH_REQUEST_TIMEOUT_SECONDS = 6;
const CATEGORY_SEARCH_RULES: Record<SearchCategory, Record<string, Record<string, unknown>>> = {
  all: {},
  song: {
    NeteaseMusicClient: { type: 1 },
    QQMusicClient: { search_type: 0 },
  },
  album: {
    NeteaseMusicClient: { type: 10 },
    QQMusicClient: { search_type: 2 },
  },
  artist: {
    NeteaseMusicClient: { type: 100 },
    QQMusicClient: { search_type: 1 },
  },
};

async function readError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    const error = data.error ?? data.detail ?? data;
    if (typeof error === 'string') return error;
    return error.message ?? JSON.stringify(error);
  } catch {
    return `${res.status} ${res.statusText}`;
  }
}

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<T>;
}

export function toSongResult(song: RawSongInfo, fallbackSource: string, index: number): SongResult {
  const source = song.source || fallbackSource;
  const identifier = song.identifier != null ? String(song.identifier) : `${source}-${index}`;
  const bitrate = buildBitrateMetadata(song);
  return {
    id: `${source}:${identifier}:${index}`,
    title: song.song_name || 'Untitled',
    artist: song.singers || '-',
    album: song.album || '-',
    duration: song.duration || '-',
    source,
    format: song.ext || '-',
    formatTone: getFormatTone(song.ext),
    bitrate: bitrate.label,
    bitrateKind: bitrate.kind,
    bitrateTier: bitrate.tier,
    bitrateKbps: bitrate.value,
    fileSize: song.file_size || '-',
    raw: { ...song, source },
  };
}

function buildCookieConfig(sources: string[], settings?: RequestSettings) {
  return Object.fromEntries(
    sources
      .map((source) => [source, parseCookieString(settings?.sourceCookies[source] ?? '')] as const)
      .filter(([, cookies]) => Object.keys(cookies).length > 0)
      .map(([source, cookies]) => [
        source,
        {
          default_search_cookies: cookies,
          default_download_cookies: cookies,
          default_parse_cookies: cookies,
        },
      ]),
  );
}

function mergeSourceConfig(
  base: Record<string, Record<string, unknown>>,
  extra: Record<string, Record<string, unknown>>,
): Record<string, Record<string, unknown>> {
  const merged = { ...base };
  for (const [source, value] of Object.entries(extra)) {
    merged[source] = { ...(merged[source] ?? {}), ...value };
  }
  return merged;
}

function buildSearchOverrides(params: SearchParams, paging: Record<string, SourcePagingState>, settings?: RequestSettings) {
  const sources = params.sources.length > 0 ? params.sources : ['NeteaseMusicClient', 'QQMusicClient'];
  const perSource = SEARCH_BATCH_SIZE_PER_SOURCE;
  const searchConfig = Object.fromEntries(
    sources.map((source) => [
      source,
      {
        search_size_per_source: perSource,
        search_size_per_page: perSource,
      },
    ]),
  );
  const cookieConfig = buildCookieConfig(sources, settings);
  const categoryRules = CATEGORY_SEARCH_RULES[params.category] ?? {};
  const pagingRules = Object.fromEntries(
    sources.map((source) => {
      const sourcePaging = paging[source] ?? { offset: 0, page: 1, exhausted: false };
      const sourceRule: Record<string, unknown> = {};
      if (source === 'NeteaseMusicClient') sourceRule.offset = sourcePaging.offset;
      if (source === 'QQMusicClient') sourceRule.page_num = sourcePaging.page;
      return [source, sourceRule];
    }),
  );
  return {
    init_music_clients_cfg: mergeSourceConfig(searchConfig, cookieConfig),
    clients_threadings: Object.fromEntries(sources.map((source) => [source, Math.max(1, perSource)])),
    requests_overrides: Object.fromEntries(sources.map((source) => [source, { timeout: SEARCH_REQUEST_TIMEOUT_SECONDS }])),
    search_rules: Object.fromEntries(
      sources.map((source) => [source, { ...(categoryRules[source] ?? {}), ...(pagingRules[source] ?? {}) }]),
    ),
  };
}

function buildDownloadOverrides(source: string, settings?: RequestSettings) {
  return {
    init_music_clients_cfg: buildCookieConfig([source], settings),
    requests_overrides: {},
    clients_threadings: {},
    search_rules: {},
  };
}

export function normalizeTask(task: TaskResponse, title = '下载任务'): DownloadTask {
  const total = task.total ?? 0;
  const completed = task.completed ?? 0;
  const progress = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : task.status === 'success' ? 100 : 0;
  const artifacts = (task.artifacts ?? []).map((artifact, index) => ({
    ...artifact,
    download_url: `/api/v1/tasks/${task.task_id}/artifacts/${index}`,
  }));
  return {
    task_id: task.task_id,
    title,
    status: task.status,
    total,
    completed,
    failed: task.failed ?? 0,
    progress,
    logs: task.logs ?? [],
    artifacts,
    error: task.error,
    serverPath: artifacts[0]?.relative_path,
  };
}

export async function fetchSources(): Promise<SourceOption[]> {
  const data = await requestJson<{ sources: string[] }>('/api/v1/sources');
  return data.sources.map((source) => ({ value: source, label: displaySource(source) }));
}

export async function searchSongBatch(
  params: SearchParams,
  paging: Record<string, SourcePagingState>,
  settings?: RequestSettings,
): Promise<SongResult[]> {
  const data = await requestJson<SearchResponse>('/api/v1/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      keyword: params.keyword.trim(),
      sources: params.sources,
      overrides: buildSearchOverrides(params, paging, settings),
    }),
  });
  return Object.entries(data.results)
    .flatMap(([source, songs]) => songs.map((song, index) => toSongResult(song, source, index)))
    .slice(0, params.sources.length * SEARCH_BATCH_SIZE_PER_SOURCE);
}

export async function resolvePlayback(song: SongResult, settings?: RequestSettings): Promise<PlaybackResponse> {
  return requestJson<PlaybackResponse>('/api/v1/playback/resolve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source: song.source,
      song_id: song.raw.identifier != null ? String(song.raw.identifier) : undefined,
      song_info: song.raw,
      overrides: buildDownloadOverrides(song.source, settings),
    }),
  });
}

export async function createDownloadTask(song: SongResult, settings?: RequestSettings): Promise<DownloadTask> {
  const task = await requestJson<TaskResponse>('/api/v1/download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      song_infos: [song.raw],
      sources: [song.source],
      overrides: buildDownloadOverrides(song.source, settings),
      filename_format: (settings?.downloadFilenameFormat ?? 'artist-title') satisfies DownloadFilenameFormat,
    }),
  });
  return normalizeTask(task, song.title);
}

export async function getTask(taskId: string, title?: string): Promise<DownloadTask> {
  return normalizeTask(await requestJson<TaskResponse>(`/api/v1/tasks/${taskId}`), title);
}

export function subscribeTask(taskId: string, title: string, onMessage: (task: DownloadTask) => void, onError: (error: Error) => void): EventSource {
  const source = new EventSource(`/api/v1/tasks/${taskId}/stream`);
  source.onmessage = (event) => {
    onMessage(normalizeTask(JSON.parse(event.data) as TaskResponse, title));
  };
  source.onerror = () => {
    onError(new Error(`task stream disconnected: ${taskId}`));
    source.close();
  };
  return source;
}

export async function directDownload(url: string, filename: string): Promise<void> {
  const response = await fetch('/api/v1/download/direct', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, filename }),
  });
  if (!response.ok) throw new Error(await readError(response));

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
}
