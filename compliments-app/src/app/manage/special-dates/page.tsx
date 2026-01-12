'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import AnimatedBackground from '@/components/AnimatedBackground';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';
import Link from 'next/link';

const EMOJI_OPTIONS = ['❤️', '🌹', '💕', '🎂', '🗓️', '💑', '🎉', '✨', '🌸', '💐'];

export default function ManageSpecialDatesPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { specialDates, addSpecialDate, removeSpecialDate } = useData();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [emoji, setEmoji] = useState('❤️');
  const [recurring, setRecurring] = useState(true);

  const handleAdd = () => {
    if (title.trim() && date) {
      addSpecialDate(title.trim(), date, emoji, recurring);
      setTitle('');
      setDate('');
      setEmoji('❤️');
      setRecurring(true);
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 px-4 py-8 max-w-2xl mx-auto min-h-screen">
        {/* Back button */}
        <Link
          href="/special-dates"
          className={`fixed top-4 left-4 md:top-6 md:left-6 text-sm md:text-base transition-colors z-20 ${isDark ? 'text-purple-400 hover:text-purple-300' : 'text-pink-400 hover:text-pink-500'
            }`}
        >
          ← Back to Special Dates
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
            Manage Special Dates 🗓️
          </h1>
        </motion.div>

        {/* Add new special date */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={`rounded-2xl p-6 mb-6 ${isDark
              ? 'bg-slate-800/80 border border-purple-500/30'
              : 'bg-white/80 border border-pink-200'
            }`}
        >
          <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-pink-300' : 'text-rose-700'}`}>
            Add New Special Date
          </h2>

          <div className="space-y-4">
            <div>
              <label className={`block text-sm mb-1 ${isDark ? 'text-purple-300' : 'text-pink-500'}`}>
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Our Anniversary"
                className={`w-full p-3 rounded-xl border transition-colors ${isDark
                    ? 'bg-slate-900/50 border-purple-500/30 text-pink-100 placeholder-purple-400/50'
                    : 'bg-pink-50 border-pink-200 text-rose-800 placeholder-pink-300'
                  }`}
              />
            </div>

            <div>
              <label className={`block text-sm mb-1 ${isDark ? 'text-purple-300' : 'text-pink-500'}`}>
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full p-3 rounded-xl border transition-colors ${isDark
                    ? 'bg-slate-900/50 border-purple-500/30 text-pink-100'
                    : 'bg-pink-50 border-pink-200 text-rose-800'
                  }`}
              />
            </div>

            <div>
              <label className={`block text-sm mb-1 ${isDark ? 'text-purple-300' : 'text-pink-500'}`}>
                Emoji
              </label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setEmoji(e)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${emoji === e
                        ? isDark
                          ? 'bg-pink-500 ring-2 ring-pink-300'
                          : 'bg-rose-500 ring-2 ring-rose-300'
                        : isDark
                          ? 'bg-slate-700 hover:bg-slate-600'
                          : 'bg-pink-100 hover:bg-pink-200'
                      }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setRecurring(!recurring)}
                className={`w-6 h-6 rounded border flex items-center justify-center ${recurring
                    ? isDark ? 'bg-pink-500 border-pink-400' : 'bg-rose-500 border-rose-400'
                    : isDark ? 'bg-slate-700 border-purple-500/30' : 'bg-pink-50 border-pink-200'
                  }`}
              >
                {recurring && <span className="text-white text-sm">✓</span>}
              </button>
              <label className={`text-sm ${isDark ? 'text-purple-300' : 'text-pink-500'}`}>
                Recurring yearly
              </label>
            </div>
          </div>

          <button
            onClick={handleAdd}
            disabled={!title.trim() || !date}
            className={`mt-6 px-6 py-2 rounded-xl font-medium transition-all ${title.trim() && date
                ? isDark
                  ? 'bg-pink-500 hover:bg-pink-400 text-white'
                  : 'bg-rose-500 hover:bg-rose-400 text-white'
                : isDark
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-pink-100 text-pink-300 cursor-not-allowed'
              }`}
          >
            + Add Special Date
          </button>
        </motion.div>

        {/* List of special dates */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-pink-300' : 'text-rose-700'}`}>
            All Special Dates ({specialDates.length})
          </h2>
          <div className="space-y-3">
            {specialDates.map((sd, index) => (
              <motion.div
                key={sd.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-4 p-4 rounded-xl ${isDark
                    ? 'bg-slate-800/60 border border-purple-500/20'
                    : 'bg-white/60 border border-pink-200/50'
                  }`}
              >
                <span className="text-2xl">{sd.emoji}</span>
                <div className="flex-1">
                  <p className={`font-medium ${isDark ? 'text-pink-200' : 'text-rose-700'}`}>
                    {sd.title}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-purple-400' : 'text-pink-400'}`}>
                    {new Date(sd.date).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                    {sd.recurring && ' • Recurring'}
                  </p>
                </div>
                <button
                  onClick={() => removeSpecialDate(sd.id)}
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isDark
                      ? 'bg-red-900/50 hover:bg-red-800/70 text-red-300'
                      : 'bg-red-100 hover:bg-red-200 text-red-500'
                    }`}
                >
                  ✕
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
