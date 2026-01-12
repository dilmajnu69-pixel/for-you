'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedBackground from '@/components/AnimatedBackground';
import { useTheme } from '@/context/ThemeContext';
import Link from 'next/link';

import { APP_CONFIG } from '@/config/constants';

// ...

export default function MusicPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // State Management
  const [playlistId, setPlaylistId] = useState(APP_CONFIG.DEFAULT_PLAYLIST_ID);
  const [refreshKey, setRefreshKey] = useState(0); // Used to force iframe reload
  const [isEditing, setIsEditing] = useState(false); // Toggle for "Change Playlist" UI
  const [inputUrl, setInputUrl] = useState('');
  const [isSpotifyLoggedIn, setIsSpotifyLoggedIn] = useState(false);

  // Load saved playlist and check login state from sessionStorage
  useEffect(() => {
    const saved = localStorage.getItem('spotifyPlaylistId');
    if (saved) {
      // eslint-disable-next-line
      setPlaylistId(saved);
    }

    // Check session storage for login state (persists only for current session)
    // This allows us to show "Logged In" UI without real OAuth integration
    const loggedIn = sessionStorage.getItem('spotifyLoggedIn');
    if (loggedIn === 'true') {
      setIsSpotifyLoggedIn(true);
    }
  }, []);

  // Force re-render of iframe component
  // Useful if Spotify embed gets stuck or fails to load
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const extractPlaylistId = (url: string) => {
    // Matches /playlist/ID or /embed/playlist/ID
    const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  const handleSave = () => {
    const id = extractPlaylistId(inputUrl);
    if (id) {
      setPlaylistId(id);
      localStorage.setItem('spotifyPlaylistId', id);
      setIsEditing(false);
      setInputUrl('');
    } else {
      alert('Invalid Spotify Playlist URL');
    }
  };

  // Handle manual login toggle
  // Sets session-based flag to "true" to hide login prompt for this session
  const handleLoginClick = () => {
    // Manually set logged in state and save to session storage
    setIsSpotifyLoggedIn(true);
    sessionStorage.setItem('spotifyLoggedIn', 'true');
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 px-4 py-8 max-w-2xl mx-auto min-h-screen flex flex-col">
        {/* Back button */}
        <Link
          href="/"
          className={`fixed top-4 left-4 md:top-6 md:left-6 text-sm md:text-base transition-colors z-20 ${isDark ? 'text-purple-400 hover:text-purple-300' : 'text-pink-400 hover:text-pink-500'
            }`}
        >
          ← Back to Home
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 pt-12"
        >
          <h1 className={`text-2xl md:text-4xl font-semibold mb-2 transition-colors duration-300 ${isDark ? 'text-pink-300' : 'text-rose-700'
            }`}>
            Our Playlist 🎵
          </h1>
          <p className={`text-sm mb-4 ${isDark ? 'text-purple-300/70' : 'text-rose-500/70'}`}>
            Music that reminds us of each other 💕
          </p>


        </motion.div>

        {/* Main Playlist Embed */}
        <div className="flex-1 flex flex-col relative w-full mb-8">
          <motion.div
            key={refreshKey}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className={`relative rounded-3xl overflow-hidden shadow-2xl ${isDark ? 'bg-slate-800/50 shadow-purple-900/20' : 'bg-white/50 shadow-pink-200/50'
              } ${isDark ? 'bg-slate-800/50 shadow-purple-900/20' : 'bg-white/50 shadow-pink-200/50'
              }`}
          >
            {/* Refresh Button - Absolute Top Right */}
            <button
              onClick={handleRefresh}
              className={`absolute top-4 right-4 p-2 rounded-full z-10 backdrop-blur-sm transition-all hover:rotate-180 duration-500 ${isDark ? 'bg-slate-900/50 text-purple-300 hover:text-white' : 'bg-white/50 text-pink-500 hover:text-rose-600'
                }`}
              title="Refresh Playlist"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 21h5v-5" />
              </svg>
            </button>

            <iframe
              title="Spotify Playlist"
              src={`https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=1`}
              width="100%"
              height="500"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="min-h-[500px]"
            />
          </motion.div>

          {/* Login CTA */}
          <div className="text-center mt-4 h-12">
            <AnimatePresence mode="wait">
              {!isSpotifyLoggedIn ? (
                <motion.div
                  key="login-btn"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <p className={`text-xs mb-2 ${isDark ? 'text-purple-300/70' : 'text-rose-500/70'}`}>
                    Hearing only previews?
                  </p>
                  <a
                    href="https://accounts.spotify.com/login"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleLoginClick}
                    className={`inline-block px-4 py-2 rounded-full text-xs font-medium transition-colors ${isDark
                      ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                  >
                    Log in to Spotify 🎧
                  </a>
                </motion.div>
              ) : (
                <motion.div
                  key="logged-in-msg"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border ${isDark
                    ? 'bg-slate-800/50 text-green-400 border-green-500/20'
                    : 'bg-white/50 text-green-600 border-green-200'
                    }`}
                >
                  <span>✅ Logged In</span>
                  <span className="opacity-50 text-[10px]">(Session Active)</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Change Playlist Control */}
        <div className="text-center mt-auto">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className={`text-xs underline ${isDark ? 'text-purple-400' : 'text-rose-400'}`}
            >
              Change Playlist
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl mt-4 ${isDark ? 'bg-slate-800' : 'bg-white'}`}
            >
              <label className={`block text-xs mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Paste Spotify Playlist Link:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className={`flex-1 text-sm p-2 rounded border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-200'}`}
                  placeholder="https://open.spotify.com/playlist/..."
                />
                <button
                  onClick={handleSave}
                  className={`px-4 py-2 text-sm rounded-lg font-medium ${isDark ? 'bg-purple-600 text-white' : 'bg-rose-500 text-white'}`}
                >
                  Save
                </button>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className={`text-xs mt-2 underline ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
              >
                Cancel
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </main>
  );
}
