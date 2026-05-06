import { create } from 'zustand';
import { createDownloadTask, resolvePlayback, searchSongs } from '../api/client';
import type { DownloadTask, SearchParams, SongResult } from '../types';

interface AppState {
  searchParams: SearchParams;
  results: SongResult[];
  playingQueue: SongResult[];
  currentSong?: SongResult;
  playbackUrl?: string;
  downloadTasks: DownloadTask[];
  loading: boolean;
  error?: string;
  setSearchParams: (params: Partial<SearchParams>) => void;
  runSearch: () => Promise<void>;
  playSong: (song: SongResult) => Promise<void>;
  enqueueDownload: (song: SongResult) => Promise<void>;
  upsertTask: (task: DownloadTask) => void;
  retryTask: (task: DownloadTask) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  searchParams: { keyword: '', sources: ['netease', 'qq'], limit: 20 },
  results: [],
  playingQueue: [],
  downloadTasks: [],
  loading: false,
  setSearchParams: (params) => set((s) => ({ searchParams: { ...s.searchParams, ...params } })),
  runSearch: async () => {
    set({ loading: true, error: undefined });
    try {
      const results = await searchSongs(get().searchParams);
      set({ results, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false, results: [] });
    }
  },
  playSong: async (song) => {
    try {
      const data = await resolvePlayback(song.id, song.source);
      set((s) => ({ currentSong: song, playbackUrl: data.url, playingQueue: [song, ...s.playingQueue.filter((x) => x.id !== song.id)] }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },
  enqueueDownload: async (song) => {
    try {
      const task = await createDownloadTask(song.id, song.source);
      set((s) => ({ downloadTasks: [task, ...s.downloadTasks] }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },
  upsertTask: (task) => set((s) => ({ downloadTasks: [task, ...s.downloadTasks.filter((t) => t.id !== task.id)] })),
  retryTask: async (task) => {
    await get().enqueueDownload({
      id: task.id,
      title: task.title,
      artist: '',
      duration: '--',
      source: 'unknown',
      quality: 'unknown',
    });
  },
}));
