'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className={`fixed top-4 right-4 md:top-6 md:right-6 z-30 w-12 h-12 rounded-full backdrop-blur-sm shadow-lg flex items-center justify-center transition-all duration-300 ${isDark
          ? 'bg-slate-700/90 border border-pink-400/50 shadow-pink-500/20'
          : 'bg-white/90 border border-pink-200 shadow-pink-200/30'
        }`}
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <span className="text-2xl">🌙</span>
      ) : (
        <span className="text-2xl">☀️</span>
      )}
    </motion.button>
  );
}
