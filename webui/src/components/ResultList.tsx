import { useEffect, useRef } from 'react';
import { Empty, Spin } from 'antd';
import { Download, Loader2, Pause, Play } from 'lucide-react';
import type { SongResult } from '../types';
import { bitrateTagClassName, formatTagClassName } from '../utils/resultMetadata';
import { SourceBadge } from './SourceBadge';

interface ResultListProps {
  results: SongResult[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  effectiveMaxResults: number;
  resolvingId?: string;
  downloadingIds: string[];
  currentSong?: SongResult;
  playbackProgress?: number;
  isPlaying?: boolean;
  onPlay: (song: SongResult) => void;
  onTogglePause: () => void;
  onDownload: (song: SongResult) => void;
  onLoadMore: () => void;
  labels: {
    songName: string;
    artist: string;
    album: string;
    format: string;
    bitrate: string;
    estimatedBitrate: string;
    fileSize: string;
    duration: string;
    source: string;
    actions: string;
    noResult: string;
    play: string;
    pause: string;
    download: string;
    loadingMore: string;
    noMoreResults: string;
  };
}

function qualityLabel(song: SongResult) {
  const format = song.format.toLowerCase();
  if (format.includes('flac') || format.includes('wav')) return 'SQ';
  if (format.includes('mp3') && (song.bitrateKbps || 0) >= 320) return 'HQ';
  return song.format.toUpperCase();
}

export function ResultList({
  results,
  loading,
  loadingMore,
  hasMore,
  effectiveMaxResults,
  resolvingId,
  downloadingIds,
  currentSong,
  playbackProgress,
  isPlaying,
  onPlay,
  onTogglePause,
  onDownload,
  onLoadMore,
  labels,
}: ResultListProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || loading || loadingMore || !hasMore) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onLoadMore();
      },
      { root: null, rootMargin: '260px 0px', threshold: 0.01 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, onLoadMore, results.length]);

  const reachedCap = results.length >= effectiveMaxResults;
  const bitrateLabel = (song: SongResult) => (song.bitrateKind === 'estimated' ? labels.estimatedBitrate : labels.bitrate);

  return (
    <section className="result-panel">
      <div className="result-grid result-header">
        <span>{labels.songName}</span>
        <span>{labels.artist}</span>
        <span>{labels.album}</span>
        <span>{labels.format}</span>
        <span>{labels.fileSize}</span>
        <span>{labels.duration}</span>
        <span>{labels.source}</span>
        <span>{labels.actions}</span>
      </div>
      {loading && results.length === 0 ? (
        <div className="state-panel">
          <Spin />
        </div>
      ) : results.length === 0 ? (
        <Empty className="state-panel" description={labels.noResult} />
      ) : (
        <>
          <div className="result-body">
            {results.map((song) => (
              <article className="result-row result-grid" key={song.id}>
                <div className="song-cell">
                  <div className="row-cover">{song.raw.cover_url ? <img src={song.raw.cover_url} alt="" /> : <span>♪</span>}</div>
                  <strong>{song.title}</strong>
                  <span className="quality-badge">{qualityLabel(song)}</span>
                </div>
                <span>{song.artist}</span>
                <span>{song.album}</span>
                <span className="format-tags" aria-label={`${labels.format}: ${song.format}; ${bitrateLabel(song)}: ${song.bitrate}`}>
                  <span className={formatTagClassName(song.formatTone)}>{song.format.toUpperCase()}</span>
                  <span className={bitrateTagClassName(song.bitrateTier, song.bitrateKind)} title={`${bitrateLabel(song)}: ${song.bitrate}`}>
                    {song.bitrate}
                  </span>
                </span>
                <span className="file-size-cell">{song.fileSize}</span>
                <span>{song.duration}</span>
                <SourceBadge source={song.source} compact />
                <div className="row-actions">
                  {currentSong?.id === song.id && isPlaying ? (
                    <span className="play-progress-wrap">
                      <svg className="play-progress-ring" viewBox="0 0 40 40">
                        <circle cx="20" cy="20" r="17" fill="none" stroke="rgba(120,132,180,0.18)" strokeWidth="2.5" />
                        <circle
                          cx="20"
                          cy="20"
                          r="17"
                          fill="none"
                          stroke="#4c5cff"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 17}`}
                          strokeDashoffset={`${2 * Math.PI * 17 * (1 - (playbackProgress || 0))}`}
                          transform="rotate(-90 20 20)"
                        />
                      </svg>
                      <button
                        className="round-action"
                        type="button"
                        onClick={onTogglePause}
                        aria-label={labels.pause}
                      >
                        <Pause size={16} />
                      </button>
                    </span>
                  ) : (
                    <button
                      className="round-action"
                      type="button"
                      onClick={() => currentSong?.id === song.id ? onTogglePause() : onPlay(song)}
                      disabled={resolvingId === song.id}
                      aria-label={currentSong?.id === song.id ? labels.play : labels.play}
                    >
                      {resolvingId === song.id ? <Loader2 className="spin-icon" size={18} /> : <Play size={18} />}
                    </button>
                  )}
                  <button
                    className="round-action"
                    type="button"
                    onClick={() => onDownload(song)}
                    disabled={downloadingIds.includes(song.id)}
                    aria-label={labels.download}
                  >
                    {downloadingIds.includes(song.id) ? <Loader2 className="spin-icon" size={18} /> : <Download size={18} />}
                  </button>
                </div>
              </article>
            ))}
          </div>
          <div ref={sentinelRef} className="result-sentinel" aria-hidden="true" />
          {(loadingMore || !hasMore || reachedCap) && (
            <div className="result-footer-state">
              {loadingMore ? (
                <>
                  <Spin size="small" />
                  <span>{labels.loadingMore}</span>
                </>
              ) : (
                <span>{labels.noMoreResults}</span>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
