import { create } from 'zustand';
import {
  createDownloadTask,
  directDownload,
  fetchSources,
  getTask,
  resolvePlayback,
  SEARCH_BATCH_SIZE_PER_SOURCE,
  searchSongBatch,
  subscribeTask,
} from '../api/client';
import type { AppView, DownloadTask, SearchParams, SongResult, SourceOption, SourcePagingState, WebUISettings } from '../types';
import { formatDownloadFilename } from '../utils/filenames';

const DEFAULT_SOURCES: SourceOption[] = [
  { value: 'NeteaseMusicClient', label: 'Netease' },
  { value: 'QQMusicClient', label: 'QQ' },
];

const taskStreams = new Map<string, EventSource>();
const SETTINGS_STORAGE_KEY = 'musicdl-webui-settings';

const DEFAULT_SETTINGS: WebUISettings = {
  sourceCookies: {},
  activeCookieSource: 'NeteaseMusicClient',
  downloadMode: 'server',
  autoImportToLibrary: true,
  maxResults: undefined,
  downloadFilenameFormat: 'artist-title',
};

function loadPersistedSettings(): WebUISettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<WebUISettings>;
    const maxResults = typeof parsed.maxResults === 'number' && parsed.maxResults > 0 ? Math.floor(parsed.maxResults) : undefined;
    return {
      sourceCookies: parsed.sourceCookies && typeof parsed.sourceCookies === 'object' ? parsed.sourceCookies : {},
      activeCookieSource: parsed.activeCookieSource || DEFAULT_SETTINGS.activeCookieSource,
      downloadMode: parsed.downloadMode === 'browser' ? 'browser' : 'server',
      autoImportToLibrary: typeof parsed.autoImportToLibrary === 'boolean' ? parsed.autoImportToLibrary : true,
      maxResults,
      downloadFilenameFormat: parsed.downloadFilenameFormat === 'title-artist' ? 'title-artist' : 'artist-title',
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function persistSettings(settings: WebUISettings) {
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

function effectiveMaxResults(params: SearchParams, settings: WebUISettings): number {
  return settings.maxResults && settings.maxResults > 0 ? settings.maxResults : Math.max(params.sources.length, 1) * 5;
}

function initialPaging(sources: string[]): Record<string, SourcePagingState> {
  return Object.fromEntries(sources.map((source) => [source, { offset: 0, page: 1, exhausted: false }]));
}

function resultKey(song: SongResult): string {
  const identifier = song.raw.identifier ?? `${song.title}:${song.artist}:${song.album}`;
  return `${song.source}:${identifier}`;
}

function appendUnique(existing: SongResult[], incoming: SongResult[], limit: number) {
  const seen = new Set(existing.map(resultKey));
  const unique: SongResult[] = [];
  for (const song of incoming) {
    const key = resultKey(song);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(song);
    if (existing.length + unique.length >= limit) break;
  }
  return unique;
}

function advancePaging(
  paging: Record<string, SourcePagingState>,
  sources: string[],
  incoming: SongResult[],
  added: SongResult[],
): Record<string, SourcePagingState> {
  const incomingBySource = incoming.reduce<Record<string, number>>((acc, song) => {
    acc[song.source] = (acc[song.source] ?? 0) + 1;
    return acc;
  }, {});
  const addedBySource = added.reduce<Record<string, number>>((acc, song) => {
    acc[song.source] = (acc[song.source] ?? 0) + 1;
    return acc;
  }, {});

  return Object.fromEntries(
    sources.map((source) => {
      const current = paging[source] ?? { offset: 0, page: 1, exhausted: false };
      const received = incomingBySource[source] ?? 0;
      const accepted = addedBySource[source] ?? 0;
      return [
        source,
        {
          offset: current.offset + SEARCH_BATCH_SIZE_PER_SOURCE,
          page: current.page + 1,
          exhausted: current.exhausted || received === 0 || accepted === 0 || received < SEARCH_BATCH_SIZE_PER_SOURCE,
        },
      ];
    }),
  );
}

interface AppState {
  view: AppView;
  searchParams: SearchParams;
  sourceOptions: SourceOption[];
  settings: WebUISettings;
  results: SongResult[];
  playbackQueue: SongResult[];
  currentIndex: number;
  hasSearched: boolean;
  currentSong?: SongResult;
  playbackUrl?: string;
  downloadTasks: DownloadTask[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  effectiveMaxResults: number;
  searchPaging: Record<string, SourcePagingState>;
  sourcesLoading: boolean;
  resolvingId?: string;
  downloadingIds: string[];
  queueOpen: boolean;
  playlistOpen: boolean;
  error?: string;
  setView: (view: AppView) => void;
  setSearchParams: (params: Partial<SearchParams>) => void;
  updateSettings: (settings: Partial<WebUISettings>) => void;
  setSourceCookie: (source: string, cookie: string) => void;
  clearSourceCookie: (source: string) => void;
  setQueueOpen: (open: boolean) => void;
  setPlaylistOpen: (open: boolean) => void;
  loadSources: () => Promise<void>;
  runSearch: (emptyKeywordMessage: string) => Promise<void>;
  loadMoreResults: () => Promise<void>;
  playSong: (song: SongResult) => Promise<void>;
  playQueueIndex: (index: number) => Promise<void>;
  playAdjacent: (direction: -1 | 1) => Promise<void>;
  enqueueDownload: (song: SongResult) => Promise<void>;
  upsertTask: (task: DownloadTask) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  view: 'search',
  searchParams: { keyword: '', sources: DEFAULT_SOURCES.map((source) => source.value), category: 'song' },
  sourceOptions: DEFAULT_SOURCES,
  settings: loadPersistedSettings(),
  results: [],
  playbackQueue: [],
  currentIndex: -1,
  hasSearched: false,
  downloadTasks: [],
  loading: false,
  loadingMore: false,
  hasMore: false,
  effectiveMaxResults: DEFAULT_SOURCES.length * 5,
  searchPaging: initialPaging(DEFAULT_SOURCES.map((source) => source.value)),
  sourcesLoading: false,
  downloadingIds: [],
  queueOpen: false,
  playlistOpen: false,
  setView: (view) => set({ view }),
  setSearchParams: (params) => set((state) => ({ searchParams: { ...state.searchParams, ...params } })),
  updateSettings: (settings) =>
    set((state) => {
      const nextSettings = { ...state.settings, ...settings };
      persistSettings(nextSettings);
      return {
        settings: nextSettings,
        effectiveMaxResults: state.hasSearched ? state.effectiveMaxResults : effectiveMaxResults(state.searchParams, nextSettings),
      };
    }),
  setSourceCookie: (source, cookie) =>
    set((state) => {
      const nextSettings = {
        ...state.settings,
        activeCookieSource: source,
        sourceCookies: { ...state.settings.sourceCookies, [source]: cookie },
      };
      persistSettings(nextSettings);
      return { settings: nextSettings };
    }),
  clearSourceCookie: (source) =>
    set((state) => {
      const sourceCookies = { ...state.settings.sourceCookies };
      delete sourceCookies[source];
      const nextSettings = { ...state.settings, activeCookieSource: source, sourceCookies };
      persistSettings(nextSettings);
      return { settings: nextSettings };
    }),
  setQueueOpen: (open) => set({ queueOpen: open }),
  setPlaylistOpen: (open) => set({ playlistOpen: open }),
  loadSources: async () => {
    set({ sourcesLoading: true });
    try {
      const sources = await fetchSources();
      const defaults = DEFAULT_SOURCES.filter((source) => sources.some((option) => option.value === source.value)).map((source) => source.value);
      set((state) => {
        const selectedSources = state.searchParams.sources.length ? state.searchParams.sources : defaults;
        const searchParams = { ...state.searchParams, sources: selectedSources };
        return {
          sourceOptions: sources,
          sourcesLoading: false,
          settings: {
            ...state.settings,
            activeCookieSource: sources.some((source) => source.value === state.settings.activeCookieSource)
              ? state.settings.activeCookieSource
              : sources[0]?.value || DEFAULT_SETTINGS.activeCookieSource,
          },
          searchParams,
          effectiveMaxResults: state.hasSearched ? state.effectiveMaxResults : effectiveMaxResults(searchParams, state.settings),
        };
      });
    } catch (err) {
      set({ sourcesLoading: false, error: (err as Error).message });
    }
  },
  runSearch: async (emptyKeywordMessage) => {
    const params = get().searchParams;
    if (!params.keyword.trim()) {
      set({ error: emptyKeywordMessage, results: [], hasSearched: false, hasMore: false });
      return;
    }

    const maxResults = effectiveMaxResults(params, get().settings);
    const searchPaging = initialPaging(params.sources);
    set({
      loading: true,
      loadingMore: false,
      error: undefined,
      hasSearched: true,
      hasMore: true,
      effectiveMaxResults: maxResults,
      searchPaging,
      results: [],
      playbackQueue: [],
      view: 'search',
    });

    try {
      const incoming = await searchSongBatch(params, searchPaging, get().settings);
      const added = appendUnique([], incoming, maxResults);
      const nextPaging = advancePaging(searchPaging, params.sources, incoming, added);
      const hasMore = added.length > 0 && added.length < maxResults && Object.values(nextPaging).some((item) => !item.exhausted);
      set({
        results: added,
        playbackQueue: added,
        loading: false,
        hasMore,
        searchPaging: nextPaging,
      });
    } catch (err) {
      set({ error: (err as Error).message, loading: false, results: [], playbackQueue: [], hasMore: false });
    }
  },
  loadMoreResults: async () => {
    const state = get();
    if (state.loading || state.loadingMore || !state.hasMore || state.results.length >= state.effectiveMaxResults) return;

    set({ loadingMore: true, error: undefined });
    try {
      const params = state.searchParams;
      const activeSources = params.sources.filter((source) => !state.searchPaging[source]?.exhausted);
      if (activeSources.length === 0) {
        set({ loadingMore: false, hasMore: false });
        return;
      }
      const requestParams = { ...params, sources: activeSources };
      const incoming = await searchSongBatch(requestParams, state.searchPaging, state.settings);
      const existing = get().results;
      const added = appendUnique(existing, incoming, state.effectiveMaxResults);
      const nextResults = [...existing, ...added];
      const nextPaging = { ...state.searchPaging, ...advancePaging(state.searchPaging, activeSources, incoming, added) };
      const hasMore = nextResults.length < state.effectiveMaxResults && added.length > 0 && Object.values(nextPaging).some((item) => !item.exhausted);
      const currentSong = get().currentSong;
      const currentIndex = currentSong ? nextResults.findIndex((song) => song.id === currentSong.id) : get().currentIndex;
      set({
        results: nextResults,
        playbackQueue: nextResults,
        currentIndex,
        loadingMore: false,
        hasMore,
        searchPaging: nextPaging,
      });
    } catch (err) {
      set({ error: (err as Error).message, loadingMore: false });
    }
  },
  playSong: async (song) => {
    const queue = get().playbackQueue.length ? get().playbackQueue : get().results;
    const existingIndex = queue.findIndex((candidate) => candidate.id === song.id);
    const nextQueue = existingIndex >= 0 ? queue : [...queue, song];
    const currentIndex = existingIndex >= 0 ? existingIndex : nextQueue.length - 1;
    set({ resolvingId: song.id, error: undefined, playbackQueue: nextQueue, currentIndex });
    try {
      const data = await resolvePlayback(song, get().settings);
      set({ currentSong: song, playbackUrl: data.stream_url, resolvingId: undefined, currentIndex });
    } catch (err) {
      set({ error: (err as Error).message, resolvingId: undefined });
    }
  },
  playQueueIndex: async (index) => {
    const song = get().playbackQueue[index];
    if (!song) return;
    await get().playSong(song);
  },
  playAdjacent: async (direction) => {
    const state = get();
    const nextIndex = state.currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= state.playbackQueue.length) return;
    await get().playQueueIndex(nextIndex);
  },
  enqueueDownload: async (song) => {
    set((state) => ({
      downloadingIds: [...state.downloadingIds, song.id],
      queueOpen: state.settings.downloadMode === 'server' ? true : state.queueOpen,
      error: undefined,
    }));
    try {
      const settings = get().settings;
      if (settings.downloadMode === 'browser') {
        try {
          const directUrl = typeof song.raw.download_url === 'string' ? song.raw.download_url : undefined;
          const resolvedUrl = directUrl || (await resolvePlayback(song, settings)).stream_url;
          if (resolvedUrl) {
            const filename = formatDownloadFilename(song, settings.downloadFilenameFormat);
            await directDownload(resolvedUrl, filename);
            return;
          }
        } catch {
          // Fall back to the server task path below.
        }
      }

      set({ queueOpen: true });
      const task = await createDownloadTask(song, settings);
      get().upsertTask(task);
      const stream = subscribeTask(
        task.task_id,
        song.title,
        (updatedTask) => {
          get().upsertTask(updatedTask);
          if (updatedTask.status === 'success' || updatedTask.status === 'failed') {
            taskStreams.get(updatedTask.task_id)?.close();
            taskStreams.delete(updatedTask.task_id);
            void getTask(updatedTask.task_id, song.title).then(get().upsertTask).catch(() => undefined);
          }
        },
        () => undefined,
      );
      taskStreams.set(task.task_id, stream);
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set((state) => ({ downloadingIds: state.downloadingIds.filter((id) => id !== song.id) }));
    }
  },
  upsertTask: (task) =>
    set((state) => ({
      downloadTasks: [task, ...state.downloadTasks.filter((candidate) => candidate.task_id !== task.task_id)],
    })),
}));
