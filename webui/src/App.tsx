import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BottomPlayer } from './components/BottomPlayer';
import { DownloadQueue } from './components/DownloadQueue';
import { SearchPage } from './pages/SearchPage';
import { SettingsPage } from './pages/SettingsPage';
import { useAppStore } from './store/useAppStore';

export default function App() {
  const { t } = useTranslation();
  const {
    view,
    searchParams,
    sourceOptions,
    settings,
    results,
    playbackQueue,
    currentIndex,
    hasSearched,
    currentSong,
    playbackUrl,
    downloadTasks,
    loading,
    loadingMore,
    hasMore,
    effectiveMaxResults,
    sourcesLoading,
    resolvingId,
    downloadingIds,
    queueOpen,
    playlistOpen,
    error,
    setView,
    setSearchParams,
    updateSettings,
    setSourceCookie,
    clearSourceCookie,
    setQueueOpen,
    setPlaylistOpen,
    loadSources,
    runSearch,
    loadMoreResults,
    playSong,
    playQueueIndex,
    playAdjacent,
    enqueueDownload,
  } = useAppStore();

  useEffect(() => {
    void loadSources();
  }, [loadSources]);

  const labels = new Proxy(
    {},
    {
      get: (_, key) => (typeof key === 'string' ? t(key) : ''),
    },
  ) as Record<string, string>;

  return (
    <div className="app-shell">
      <div className="decor decor-record" />
      <div className="decor decor-note-left">♪</div>
      <div className="decor decor-note-right">♫</div>
      <div className="decor decor-eq" />

      {view === 'settings' ? (
        <SettingsPage
          sourceOptions={sourceOptions}
          settings={settings}
          onBack={() => setView('search')}
          onUpdateSettings={updateSettings}
          onSaveCookie={setSourceCookie}
          onClearCookie={clearSourceCookie}
          labels={labels}
        />
      ) : (
        <SearchPage
          params={searchParams}
          sourceOptions={sourceOptions}
          settings={settings}
          results={results}
          hasSearched={hasSearched}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          effectiveMaxResults={effectiveMaxResults}
          sourcesLoading={sourcesLoading}
          resolvingId={resolvingId}
          downloadingIds={downloadingIds}
          error={error}
          onParamsChange={setSearchParams}
          onSearch={() => void runSearch(t('emptyKeyword'))}
          onLoadMore={() => void loadMoreResults()}
          onOpenSettings={() => setView('settings')}
          onPlay={(song) => void playSong(song)}
          onDownload={(song) => void enqueueDownload(song)}
          labels={labels}
        />
      )}

      <DownloadQueue
        open={queueOpen}
        tasks={downloadTasks}
        onClose={() => setQueueOpen(false)}
        labels={{
          title: t('downloadQueue'),
          empty: t('noTasks'),
          failed: t('failed'),
          browserDownload: t('browserDownload'),
        }}
      />
      <BottomPlayer
        currentSong={currentSong}
        playbackUrl={playbackUrl}
        queue={playbackQueue}
        currentIndex={currentIndex}
        playlistOpen={playlistOpen}
        onTogglePlaylist={() => setPlaylistOpen(!playlistOpen)}
        onSelectTrack={(index) => void playQueueIndex(index)}
        onPrevious={() => void playAdjacent(-1)}
        onNext={() => void playAdjacent(1)}
        labels={{
          noPlaying: t('noPlaying'),
          play: t('play'),
          pause: t('pause'),
          previousTrack: t('previousTrack'),
          nextTrack: t('nextTrack'),
          playlist: t('playlist'),
          closePlaylist: t('closePlaylist'),
          seek: t('seek'),
        }}
      />
    </div>
  );
}
