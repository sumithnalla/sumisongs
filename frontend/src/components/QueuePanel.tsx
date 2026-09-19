import React from 'react';
import { X, Trash2, Music, Play } from 'lucide-react';
import { usePlayer } from '../contexts/PlayerContext';

export const QueuePanel: React.FC = () => {
  const {
    currentSong,
    queue,
    queueIndex,
    isQueueOpen,
    toggleQueue,
    removeFromQueue,
    clearQueue,
    playSong,
  } = usePlayer();

  if (!isQueueOpen) return null;

  return (
    <aside className="w-80 bg-[#121212] border-l border-[#282828] flex flex-col h-full shrink-0 z-20 select-none">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-[#242424]">
        <h2 className="text-base font-bold text-white">Playback Queue</h2>
        <div className="flex items-center gap-2">
          {queue.length > 0 && (
            <button
              onClick={clearQueue}
              className="text-xs text-[#b3b3b3] hover:text-white p-1 hover:bg-[#282828] rounded flex items-center gap-1"
              title="Clear queue"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
          <button
            onClick={toggleQueue}
            className="text-[#b3b3b3] hover:text-white p-1 hover:bg-[#282828] rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Now Playing */}
      <div className="p-4 border-b border-[#242424]">
        <span className="text-xs font-semibold text-[#b3b3b3] uppercase tracking-wider block mb-2">
          Now Playing
        </span>
        {currentSong ? (
          <div className="flex items-center gap-3 p-2 rounded-lg bg-[#242424]">
            <div className="w-10 h-10 rounded bg-[#333] flex items-center justify-center shrink-0">
              <Music className="w-5 h-5 text-[#1db954]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#1db954] truncate">{currentSong.title}</p>
              <p className="text-xs text-[#b3b3b3] truncate">{currentSong.artist}</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-[#727272]">Nothing playing right now</p>
        )}
      </div>

      {/* Next in Queue */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <span className="text-xs font-semibold text-[#b3b3b3] uppercase tracking-wider block mb-2">
          Next in Queue ({queue.length})
        </span>

        {queue.length === 0 ? (
          <p className="text-xs text-[#727272] py-4 text-center">Queue is empty</p>
        ) : (
          queue.map((song, idx) => {
            const isCurrent = idx === queueIndex;
            return (
              <div
                key={`${song.id}-${idx}`}
                className={`group flex items-center justify-between p-2 rounded-lg transition-colors ${
                  isCurrent ? 'bg-[#242424] text-[#1db954]' : 'hover:bg-[#1e1e1e] text-white'
                }`}
              >
                <div
                  className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                  onClick={() => playSong(song)}
                >
                  <div className="w-8 h-8 rounded bg-[#2a2a2a] flex items-center justify-center shrink-0 group-hover:bg-[#1db954] transition-colors">
                    {isCurrent ? (
                      <Music className="w-4 h-4 text-[#1db954]" />
                    ) : (
                      <Play className="w-4 h-4 text-white group-hover:text-black fill-current ml-0.5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{song.title}</p>
                    <p className="text-[11px] text-[#b3b3b3] truncate">{song.artist}</p>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromQueue(idx);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-[#b3b3b3] hover:text-[#ff6b6b] transition-all"
                  title="Remove from queue"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
