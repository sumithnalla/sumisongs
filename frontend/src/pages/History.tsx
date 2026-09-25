import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { History as HistoryIcon, Play, CheckCircle2, Music } from 'lucide-react';
import { historyApi } from '../api/history';
import { HistoryItem, Song } from '../types';
import { usePlayer } from '../contexts/PlayerContext';
import { LoadingScreen } from '../components/LoadingScreen';

export const History: React.FC = () => {
  const { openAddToPlaylist } = useOutletContext<{ openAddToPlaylist: (song: Song) => void }>();
  const { playSong } = usePlayer();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await historyApi.getHistory(50);
        setHistory(data.history);
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const allSongs = history.map((h) => h.song).filter(Boolean) as Song[];

  if (loading) {
    return <LoadingScreen fullScreen={false} message="Loading your listen history..." />;
  }

  return (
    <div className="p-8 space-y-6 pb-16">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#242424] flex items-center justify-center">
          <HistoryIcon className="w-5 h-5 text-[#1db954]" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Listening History</h1>
          <p className="text-xs text-[#b3b3b3]">Your most recent stream events</p>
        </div>
      </div>

      {history.length > 0 ? (
        <div className="bg-[#181818]/60 rounded-xl p-2 border border-[#222222]">
          <div className="divide-y divide-[#222222]">
            {history.map((item) => {
              if (!item.song) return null;
              return (
                <div
                  key={item.id}
                  onClick={() => playSong(item.song!, allSongs)}
                  className="group flex items-center justify-between px-4 py-3 hover:bg-[#242424] cursor-pointer rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded bg-[#333] flex items-center justify-center shrink-0 overflow-hidden relative group-hover:shadow">
                      {item.song.cover_url ? (
                        <img
                          src={item.song.cover_url}
                          alt={item.song.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Music className="w-5 h-5 text-[#777]" />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Play className="w-4 h-4 fill-white text-white" />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-white truncate">{item.song.title}</p>
                      <p className="text-xs text-[#b3b3b3] truncate">{item.song.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-[#888] shrink-0">
                    <span className="hidden sm:inline">
                      Played {Math.round(item.seconds_played)}s
                    </span>

                    {item.completed && (
                      <span className="flex items-center gap-1 text-[#1db954] text-[11px] font-medium bg-[#1db954]/10 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Completed</span>
                      </span>
                    )}

                    <span className="font-mono text-[11px]">{formatDate(item.played_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 text-[#888]">
          <HistoryIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p className="text-base font-semibold text-white">No history yet</p>
          <p className="text-xs text-[#888] mt-1">Start listening to build your music history.</p>
        </div>
      )}
    </div>
  );
};
