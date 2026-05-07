import { useEffect, useRef } from 'react';
import { Empty, Spin } from 'antd';
import { Download, Loader2, Play } from 'lucide-react';
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
  onPlay: (song: SongResult) => void;
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
  onPlay,
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
                  <button
                    className="round-action"
                    type="button"
                    onClick={() => onPlay(song)}
                    disabled={resolvingId === song.id}
                    aria-label={labels.play}
                  >
                    {resolvingId === song.id ? <Loader2 className="spin-icon" size={18} /> : <Play size={18} />}
                  </button>
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
