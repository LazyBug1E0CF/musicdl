export interface SearchParams {
  keyword: string;
  sources: string[];
  quality?: string;
  limit?: number;
}

export interface SongResult {
  id: string;
  title: string;
  artist: string;
  duration: string;
  source: string;
  quality: string;
}

export interface DownloadTask {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  error?: string;
}
