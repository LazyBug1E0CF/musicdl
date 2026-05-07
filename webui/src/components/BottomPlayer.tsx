import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Heart, ListMusic, Pause, Play, SkipBack, SkipForward, Volume2, X } from 'lucide-react';
import type { SongResult } from '../types';

interface BottomPlayerProps {
  currentSong?: SongResult;
  playbackUrl?: string;
  queue: SongResult[];
  currentIndex: number;
  playlistOpen: boolean;
  onTogglePlaylist: () => void;
  onSelectTrack: (index: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  labels: {
    noPlaying: string;
    play: string;
    pause: string;
    previousTrack: string;
    nextTrack: string;
    playlist: string;
    closePlaylist: string;
    seek: string;
  };
}

function formatTime(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '00:00';
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function BottomPlayer({
  currentSong,
  playbackUrl,
  queue,
  currentIndex,
  playlistOpen,
  onTogglePlaylist,
  onSelectTrack,
  onPrevious,
  onNext,
  labels,
}: BottomPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioError, setAudioError] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!playbackUrl) {
      audio.removeAttribute('src');
      audio.load();
      setPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      return;
    }
    setAudioError(false);
    audio.src = playbackUrl;
    audio.play().catch(() => setPlaying(false));
  }, [playbackUrl]);

  function togglePlayback() {
    const audio = audioRef.current;
    if (!audio || !playbackUrl) return;
    if (audio.paused) {
      void audio.play();
    } else {
      audio.pause();
    }
  }

  function seek(value: number) {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(duration)) return;
    audio.currentTime = value;
    setCurrentTime(value);
  }

  const canPlay = Boolean(playbackUrl && currentSong && !audioError);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < queue.length - 1;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {playlistOpen && (
        <aside className="playlist-panel" aria-label={labels.playlist}>
          <div className="playlist-header">
            <strong>{labels.playlist}</strong>
            <button className="icon-button" type="button" onClick={onTogglePlaylist} aria-label={labels.closePlaylist}>
              <X size={18} />
            </button>
          </div>
          <div className="playlist-items">
            {queue.map((song, index) => (
              <button
                className={index === currentIndex ? 'playlist-item playlist-item-active' : 'playlist-item'}
                key={song.id}
                type="button"
                onClick={() => onSelectTrack(index)}
              >
                <span className="playlist-index">{String(index + 1).padStart(2, '0')}</span>
                <span className="playlist-title">{song.title}</span>
                <span className="playlist-artist">{song.artist}</span>
              </button>
            ))}
          </div>
        </aside>
      )}
      <footer className="bottom-player">
        <audio
          ref={audioRef}
          preload="metadata"
          onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
          onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime || 0)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            setPlaying(false);
            if (hasNext) onNext();
          }}
          onError={() => {
            setAudioError(true);
            setPlaying(false);
          }}
        />
        <div className="player-track">
          <div className="cover-art">{currentSong?.raw.cover_url ? <img src={currentSong.raw.cover_url} alt="" /> : <span>♪</span>}</div>
          <div className="track-copy">
            <strong>{currentSong?.title || labels.noPlaying}</strong>
            <span>{audioError ? 'Playback unavailable' : currentSong?.artist || 'MusicDL'}</span>
          </div>
        </div>
        <button className="icon-button favorite-button" type="button" aria-label="Favorite">
          <Heart size={22} />
        </button>
        <div className="player-controls">
          <button className="icon-button" type="button" aria-label={labels.previousTrack} onClick={onPrevious} disabled={!hasPrevious}>
            <SkipBack size={22} />
          </button>
          <button className="play-button" type="button" aria-label={playing ? labels.pause : labels.play} onClick={togglePlayback} disabled={!canPlay}>
            {playing ? <Pause size={26} /> : <Play size={26} />}
          </button>
          <button className="icon-button" type="button" aria-label={labels.nextTrack} onClick={onNext} disabled={!hasNext}>
            <SkipForward size={22} />
          </button>
        </div>
        <div className="player-progress-wrap">
          <span>{formatTime(currentTime)}</span>
          <input
            aria-label={labels.seek}
            className="player-progress"
            type="range"
            min={0}
            max={duration || 0}
            step={1}
            value={Math.min(currentTime, duration || 0)}
            onChange={(event) => seek(Number(event.target.value))}
            disabled={!canPlay || duration <= 0}
            style={{ '--progress': `${progress}%` } as CSSProperties}
          />
          <span>{formatTime(duration)}</span>
        </div>
        <div className="volume-wrap">
          <Volume2 size={22} />
          <div className="volume-bar">
            <span />
          </div>
        </div>
        <button
          className={playlistOpen ? 'icon-button icon-button-active' : 'icon-button'}
          type="button"
          onClick={onTogglePlaylist}
          aria-label={playlistOpen ? labels.closePlaylist : labels.playlist}
        >
          <ListMusic size={22} />
        </button>
      </footer>
    </>
  );
}
