'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';
import Link from 'next/link';
import RomanticButton from '@/components/RomanticButton';

export default function ManageMusicPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { songs, addSong, removeSong } = useData();

  const [spotifyLink, setSpotifyLink] = useState('');
  const [songTitle, setSongTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const extractTrackId = (url: string) => {
    const match = url.match(/track\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  const handleAdd = async () => {
    setError('');
    const trackId = extractTrackId(spotifyLink);

    if (!trackId) {
      setError('Could not find Track ID. Please use a valid Spotify Track link.');
      return;
    }

    if (!songTitle.trim()) {
      setError('Please enter a song title.');
      return;
    }

    setIsAdding(true);
    try {
      await addSong(songTitle, artistName || 'Unknown Artist', trackId);
      setSpotifyLink('');
      setSongTitle('');
      setArtistName('');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (id: number) => {
    setDeletingId(id);
    try {
      await removeSong(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="relative z-10 px-4 py-8 max-w-2xl mx-auto min-h-screen">
        {/* Back button */}
        <Link
          href="/music"
          className={`fixed top-4 left-4 md:top-6 md:left-6 text-sm md:text-base transition-colors z-20 ${isDark ? 'text-purple-400 hover:text-purple-300' : 'text-pink-400 hover:text-pink-500'
            }`}
        >
          ← Back to Music
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 pt-12"
        >
          <h1 className={`text-2xl md:text-4xl font-semibold mb-4 transition-colors duration-300 ${isDark ? 'text-pink-300' : 'text-rose-700'
            }`}>
            Manage Songs 🎵
          </h1>
        </motion.div>

        {/* Add new song */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={`rounded-2xl p-6 mb-8 ${isDark
            ? 'bg-slate-800/80 border border-purple-500/30'
            : 'bg-white/80 border border-pink-200'
            }`}
        >
          <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-pink-300' : 'text-rose-700'}`}>
            Add New Song
          </h2>

          <div className="space-y-4">
            <div>
              <label className={`block text-xs mb-1 ml-1 ${isDark ? 'text-purple-300' : 'text-rose-500'}`}>
                Spotify Link (Share &gt; Copy Link to Song)
              </label>
              <input
                type="text"
                value={spotifyLink}
                onChange={(e) => setSpotifyLink(e.target.value)}
                disabled={isAdding}
                placeholder="https://open.spotify.com/track/..."
                className={`w-full p-3 rounded-xl border text-sm transition-colors ${isDark
                  ? 'bg-slate-900/50 border-purple-500/30 text-pink-100 placeholder-purple-400/50'
                  : 'bg-pink-50 border-pink-200 text-rose-800 placeholder-pink-300'
                  } ${isAdding ? 'opacity-70' : ''}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs mb-1 ml-1 ${isDark ? 'text-purple-300' : 'text-rose-500'}`}>
                  Song Title
                </label>
                <input
                  type="text"
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  disabled={isAdding}
                  placeholder="e.g. Perfect"
                  className={`w-full p-3 rounded-xl border text-sm transition-colors ${isDark
                    ? 'bg-slate-900/50 border-purple-500/30 text-pink-100 placeholder-purple-400/50'
                    : 'bg-pink-50 border-pink-200 text-rose-800 placeholder-pink-300'
                    } ${isAdding ? 'opacity-70' : ''}`}
                />
              </div>
              <div>
                <label className={`block text-xs mb-1 ml-1 ${isDark ? 'text-purple-300' : 'text-rose-500'}`}>
                  Artist (Optional)
                </label>
                <input
                  type="text"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  disabled={isAdding}
                  placeholder="e.g. Ed Sheeran"
                  className={`w-full p-3 rounded-xl border text-sm transition-colors ${isDark
                    ? 'bg-slate-900/50 border-purple-500/30 text-pink-100 placeholder-purple-400/50'
                    : 'bg-pink-50 border-pink-200 text-rose-800 placeholder-pink-300'
                    } ${isAdding ? 'opacity-70' : ''}`}
                />
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-xs px-1 font-medium">{error}</p>
            )}

            <div className="mt-4">
              <RomanticButton
                onClick={handleAdd}
                isLoading={isAdding}
                disabled={!spotifyLink.trim() || !songTitle.trim()}
                variant="primary"
              >
                Add Song 🎶
              </RomanticButton>
            </div>
          </div>
        </motion.div>

        {/* List of songs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className={`text-lg font-semibold mb-4 px-1 ${isDark ? 'text-pink-300' : 'text-rose-700'}`}>
            Your Songs ({songs.length})
          </h2>
          <div className="space-y-3 pb-8">
            {songs.map((song) => (
              <motion.div
                key={song.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`flex items-center gap-4 p-4 rounded-xl ${isDark
                  ? 'bg-slate-800/60 border border-purple-500/20'
                  : 'bg-white/60 border border-pink-200/50'
                  }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${isDark ? 'bg-purple-900/50' : 'bg-pink-100'
                  }`}>
                  🎵
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${isDark ? 'text-pink-100' : 'text-rose-700'}`}>
                    {song.title}
                  </p>
                  <p className={`text-xs truncate ${isDark ? 'text-purple-300' : 'text-rose-400'}`}>
                    {song.artist}
                  </p>
                </div>
                <button
                  onClick={() => handleRemove(song.id)}
                  disabled={deletingId === song.id}
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isDark
                    ? 'bg-red-900/50 hover:bg-red-800/70 text-red-300'
                    : 'bg-red-100 hover:bg-red-200 text-red-500'
                    } ${deletingId === song.id ? 'opacity-50 animate-pulse' : ''}`}
                  aria-label="Remove song"
                >
                  {deletingId === song.id ? '...' : '✕'}
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
