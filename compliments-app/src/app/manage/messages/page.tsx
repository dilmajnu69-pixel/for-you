'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import AnimatedBackground from '@/components/AnimatedBackground';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';
import Link from 'next/link';

// Available message categories for classification
const MESSAGE_TYPES = [
  { value: 'compliment', label: 'Compliment 💕', emoji: '💕' },
  { value: 'love', label: 'Love Note ❤️', emoji: '❤️' },
  { value: 'appreciation', label: 'Appreciation 🌟', emoji: '🌟' },
  { value: 'encouragement', label: 'Encouragement 💪', emoji: '💪' },
  { value: 'memory', label: 'Memory 📸', emoji: '📸' },
  { value: 'wish', label: 'Wish ✨', emoji: '✨' },
  { value: 'note', label: 'Note 📝', emoji: '📝' },
];

// Admin Page: Manage all generic messages displayed on the main feed
export default function ManageMessagesPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  // Use global data context to manipulate message list
  const { messages, addMessage, removeMessage } = useData();
  const [newText, setNewText] = useState('');
  const [newType, setNewType] = useState('compliment');

  // Handle addition of new message
  // Trims whitespace and resets form on success
  const handleAdd = () => {
    if (newText.trim()) {
      addMessage(newText.trim(), newType);
      setNewText('');
      setNewType('compliment');
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 px-4 py-8 max-w-2xl mx-auto min-h-screen">
        {/* Back button */}
        <Link
          href="/messages"
          className={`fixed top-4 left-4 md:top-6 md:left-6 text-sm md:text-base transition-colors z-20 ${isDark ? 'text-purple-400 hover:text-purple-300' : 'text-pink-400 hover:text-pink-500'
            }`}
        >
          ← Back to Messages
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
            Manage Messages 💌
          </h1>
        </motion.div>

        {/* Add new message form */}
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
            Add New Message
          </h2>

          {/* Message type selector */}
          <div className="mb-4">
            <label className={`block text-sm mb-2 ${isDark ? 'text-purple-300' : 'text-pink-500'}`}>
              Message Type
            </label>
            <div className="flex flex-wrap gap-2">
              {MESSAGE_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setNewType(type.value)}
                  className={`text-xs px-3 py-1.5 rounded-full transition-all ${newType === type.value
                    ? isDark
                      ? 'bg-pink-500 text-white'
                      : 'bg-rose-500 text-white'
                    : isDark
                      ? 'bg-slate-700 text-purple-300 hover:bg-slate-600'
                      : 'bg-pink-100 text-pink-500 hover:bg-pink-200'
                    }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Write your special message..."
            className={`w-full p-4 rounded-xl border resize-none h-24 transition-colors ${isDark
              ? 'bg-slate-900/50 border-purple-500/30 text-pink-100 placeholder-purple-400/50'
              : 'bg-pink-50 border-pink-200 text-rose-800 placeholder-pink-300'
              }`}
          />
          <button
            onClick={handleAdd}
            disabled={!newText.trim()}
            className={`mt-4 px-6 py-2 rounded-xl font-medium transition-all ${newText.trim()
              ? isDark
                ? 'bg-pink-500 hover:bg-pink-400 text-white'
                : 'bg-rose-500 hover:bg-rose-400 text-white'
              : isDark
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-pink-100 text-pink-300 cursor-not-allowed'
              }`}
          >
            + Add Message
          </button>
        </motion.div>

        {/* List of existing messages with delete option */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-pink-300' : 'text-rose-700'}`}>
            All Messages ({messages.length})
          </h2>
          <div className="space-y-3">
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-start gap-4 p-4 rounded-xl ${isDark
                  ? 'bg-slate-800/60 border border-purple-500/20'
                  : 'bg-white/60 border border-pink-200/50'
                  }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-purple-800/50 text-purple-300' : 'bg-pink-100 text-rose-500'
                      }`}>
                      {MESSAGE_TYPES.find(t => t.value === message.type)?.label || message.type}
                    </span>
                  </div>
                  <p className={`text-sm ${isDark ? 'text-pink-100' : 'text-rose-700'}`}>
                    &quot;{message.text}&quot;
                  </p>
                </div>
                <button
                  onClick={() => removeMessage(message.id)}
                  title="Remove message"
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
