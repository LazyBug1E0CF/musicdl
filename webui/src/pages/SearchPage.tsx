import { useEffect, useState } from 'react';
import { Alert } from 'antd';
import { Search, Settings } from 'lucide-react';
import type { SearchParams, SongResult, SourceOption, WebUISettings } from '../types';
import { SourcePicker } from '../components/SourcePicker';
import { ResultList } from '../components/ResultList';

interface SearchPageProps {
  params: SearchParams;
  sourceOptions: SourceOption[];
  settings: WebUISettings;
  results: SongResult[];
  hasSearched: boolean;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  effectiveMaxResults: number;
  sourcesLoading: boolean;
  resolvingId?: string;
  downloadingIds: string[];
  error?: string;
  currentSong?: SongResult;
  playbackProgress?: number;
  isPlaying?: boolean;
  onParamsChange: (params: Partial<SearchParams>) => void;
  onSearch: () => void;
  onLoadMore: () => void;
  onOpenSettings: () => void;
  onPlay: (song: SongResult) => void;
  onTogglePause: () => void;
  onDownload: (song: SongResult) => void;
  labels: Record<string, string>;
}

export function SearchPage({
  params,
  sourceOptions,
  settings,
  results,
  hasSearched,
  loading,
  loadingMore,
  hasMore,
  effectiveMaxResults,
  resolvingId,
  downloadingIds,
  error,
  currentSong,
  playbackProgress,
  isPlaying,
  onParamsChange,
  onSearch,
  onLoadMore,
  onOpenSettings,
  onPlay,
  onTogglePause,
  onDownload,
  labels,
}: SearchPageProps) {
  const hasResults = results.length > 0;
  const showResultsPanel = loading || hasResults || hasSearched;

  const [sourceCardCollapsed, setSourceCardCollapsed] = useState(false);

  useEffect(() => {
    if (showResultsPanel) {
      setSourceCardCollapsed(true);
    } else {
      setSourceCardCollapsed(false);
    }
  }, [showResultsPanel]);

  return (
    <main className={showResultsPanel ? 'search-page search-page-results' : 'search-page'}>
      <button className="settings-button" type="button" onClick={onOpenSettings} aria-label={labels.settings}>
        <Settings size={22} />
      </button>

      <section className={showResultsPanel ? 'hero-copy hero-hidden' : 'hero-copy'} aria-hidden={showResultsPanel}>
        <h1>
          {labels.heroPrefix}
          <span>{labels.heroAccent}</span>
        </h1>
        <p>{labels.heroSubtitle}</p>
      </section>

      <section className={showResultsPanel ? 'search-console search-console-compact' : 'search-console'}>
        <div className="search-bar">
          <Search className="search-icon" size={34} />
          <input
            value={params.keyword}
            placeholder={labels.searchPlaceholder}
            onChange={(event) => onParamsChange({ keyword: event.target.value })}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && params.sources.length > 0) onSearch();
            }}
          />
          <button
            className="primary-gradient-button"
            type="button"
            onClick={onSearch}
            disabled={loading || params.sources.length === 0}
          >
            {loading ? labels.searching : labels.search}
          </button>
        </div>
      </section>

      <div className="search-options-line">
        <div className="source-picker-card">
          <SourcePicker
            options={sourceOptions}
            selected={params.sources}
            sourceCookies={settings.sourceCookies}
            onChange={(sources) => onParamsChange({ sources })}
            collapsed={sourceCardCollapsed}
            onToggleCollapse={() => setSourceCardCollapsed((prev) => !prev)}
          />
        </div>
      </div>

      {error && <Alert className="floating-error" type="error" message={error} showIcon closable />}

      <div className={showResultsPanel ? 'results-panel-wrapper results-panel-visible' : 'results-panel-wrapper'}>
        <ResultList
          results={results}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          effectiveMaxResults={effectiveMaxResults}
          resolvingId={resolvingId}
          downloadingIds={downloadingIds}
          onPlay={onPlay}
          onTogglePause={onTogglePause}
          onDownload={onDownload}
          currentSong={currentSong}
          playbackProgress={playbackProgress}
          isPlaying={isPlaying}
          onLoadMore={onLoadMore}
          labels={{
            songName: labels.songName,
            artist: labels.artist,
            album: labels.album,
            format: labels.format,
            bitrate: labels.bitrate,
            estimatedBitrate: labels.estimatedBitrate,
            fileSize: labels.fileSize,
            duration: labels.duration,
            source: labels.source,
            actions: labels.actions,
            noResult: labels.noResult,
            play: labels.play,
            pause: labels.pause,
            download: labels.download,
            loadingMore: labels.loadingMore,
            noMoreResults: labels.noMoreResults,
          }}
        />
      </div>
    </main>
  );
}
