import { Alert } from 'antd';
import { Search, Settings } from 'lucide-react';
import type { SearchCategory, SearchParams, SongResult, SourceOption, WebUISettings } from '../types';
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
  onParamsChange: (params: Partial<SearchParams>) => void;
  onSearch: () => void;
  onLoadMore: () => void;
  onOpenSettings: () => void;
  onPlay: (song: SongResult) => void;
  onDownload: (song: SongResult) => void;
  labels: Record<string, string>;
}

const categories: SearchCategory[] = ['song', 'album', 'artist'];

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
  onParamsChange,
  onSearch,
  onLoadMore,
  onOpenSettings,
  onPlay,
  onDownload,
  labels,
}: SearchPageProps) {
  const hasResults = results.length > 0;
  const showResultsPanel = loading || hasResults || hasSearched;

  return (
    <main className={showResultsPanel ? 'search-page search-page-results' : 'search-page'}>
      <button className="settings-button" type="button" onClick={onOpenSettings} aria-label={labels.settings}>
        <Settings size={22} />
      </button>

      {!showResultsPanel && (
        <section className="hero-copy">
          <h1>
            {labels.heroPrefix}
            <span>{labels.heroAccent}</span>
          </h1>
          <p>{labels.heroSubtitle}</p>
        </section>
      )}

      <section className={showResultsPanel ? 'search-console search-console-compact' : 'search-console'}>
        <div className="category-tabs">
          {categories.map((category) => (
            <button
              className={params.category === category ? 'category-tab category-tab-active' : 'category-tab'}
              key={category}
              type="button"
              onClick={() => onParamsChange({ category })}
            >
              {labels[`category.${category}`]}
            </button>
          ))}
        </div>

        <div className="search-bar">
          <Search className="search-icon" size={34} />
          <input
            value={params.keyword}
            placeholder={labels.searchPlaceholder}
            onChange={(event) => onParamsChange({ keyword: event.target.value })}
            onKeyDown={(event) => {
              if (event.key === 'Enter') onSearch();
            }}
          />
          <button className="primary-gradient-button" type="button" onClick={onSearch} disabled={loading}>
            {loading ? labels.searching : labels.search}
          </button>
        </div>
      </section>

      <div className="search-options-line">
        <SourcePicker
          options={sourceOptions}
          selected={params.sources}
          sourceCookies={settings.sourceCookies}
          onChange={(sources) => onParamsChange({ sources })}
          label={labels.platformSources}
        />
      </div>

      {error && <Alert className="floating-error" type="error" message={error} showIcon closable />}

      {showResultsPanel && (
        <ResultList
          results={results}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          effectiveMaxResults={effectiveMaxResults}
          resolvingId={resolvingId}
          downloadingIds={downloadingIds}
          onPlay={onPlay}
          onDownload={onDownload}
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
            download: labels.download,
            loadingMore: labels.loadingMore,
            noMoreResults: labels.noMoreResults,
          }}
        />
      )}
    </main>
  );
}
