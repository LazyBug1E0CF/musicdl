import type { DownloadTask, SearchParams, SongResult } from '../types';

export async function searchSongs(params: SearchParams): Promise<SongResult[]> {
  const res = await fetch('/api/v1/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`search failed: ${res.status}`);
  return res.json();
}

export async function resolvePlayback(songId: string, source: string): Promise<{ url: string }> {
  const res = await fetch('/api/v1/playback/resolve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ songId, source }),
  });
  if (!res.ok) throw new Error(`resolve failed: ${res.status}`);
  return res.json();
}

export async function createDownloadTask(songId: string, source: string): Promise<DownloadTask> {
  const res = await fetch('/api/v1/download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ songId, source }),
  });
  if (!res.ok) throw new Error(`download failed: ${res.status}`);
  return res.json();
}

export function subscribeTasks(onMessage: (task: DownloadTask) => void): EventSource {
  const sse = new EventSource('/api/v1/tasks');
  sse.onmessage = (evt) => {
    onMessage(JSON.parse(evt.data));
  };
  return sse;
}
