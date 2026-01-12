'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedBackground from '@/components/AnimatedBackground';
import CountdownCard from '@/components/CountdownCard';
import CalendarView from '@/components/CalendarView';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';



export default function SpecialDatesPage() {
  const { specialDates } = useData();
  const [showCalendar, setShowCalendar] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Sort dates by how soon they are
  const sortedDates = [...specialDates].sort((a, b) => {
    const now = new Date().getTime();
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();

    // Adjust for past dates (next occurrence)
    const adjustedA = dateA < now ? dateA + 365 * 24 * 60 * 60 * 1000 : dateA;
    const adjustedB = dateB < now ? dateB + 365 * 24 * 60 * 60 * 1000 : dateB;

    return adjustedA - adjustedB;
  });

  return (
    <main className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 px-4 py-8 max-w-4xl mx-auto min-h-screen">
        {/* Back to Home - Fixed top left */}
        <Link
          href="/"
          className={`fixed top-4 left-4 md:top-6 md:left-6 text-sm md:text-base transition-colors z-20 ${isDark ? 'text-purple-400 hover:text-purple-300' : 'text-pink-400 hover:text-pink-500'
            }`}
        >
          ← Back to Home
        </Link>

        {/* Calendar button - Fixed top right (below theme toggle) */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCalendar(true)}
          className={`fixed top-20 right-4 md:top-24 md:right-6 z-20 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${isDark
            ? 'bg-slate-700/90 border border-pink-400/50 text-pink-300 hover:bg-pink-500/30'
            : 'bg-white/90 border border-pink-200 text-rose-500 hover:bg-pink-100'
            } backdrop-blur-sm`}
          aria-label="View calendar"
        >
          <span className="text-xl">📅</span>
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 pt-12"
        >
          <h1 className={`text-2xl md:text-4xl lg:text-5xl font-semibold mb-4 transition-colors duration-300 ${isDark ? 'text-pink-300' : 'text-rose-700'
            }`}>
            Special Dates 🗓️
          </h1>
          <p className={`text-sm md:text-base transition-colors duration-300 ${isDark ? 'text-purple-300/70' : 'text-rose-500/70'
            }`}>
            Counting down to our most precious moments 💕
          </p>
        </motion.div>

        {/* Countdown Cards Grid */}
        <div className="grid gap-4 md:gap-6 md:grid-cols-2 pb-8">
          {sortedDates.map((date, index) => (
            <CountdownCard
              key={date.id}
              title={date.title}
              date={date.date}
              emoji={date.emoji}
              index={index}
            />
          ))}
        </div>

        {/* Add Date Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className={`text-center mt-8 pb-8 text-sm font-sans transition-colors duration-300 ${isDark ? 'text-purple-300/60' : 'text-pink-400'}`}
        >
          <p className="mb-3">✨ Add more special dates ✨</p>
          <Link
            href="/manage/special-dates"
            className={`inline-block text-xs px-4 py-2 rounded-xl transition-colors ${isDark
              ? 'bg-purple-800/50 text-purple-300 hover:bg-purple-700/50'
              : 'bg-pink-100 text-rose-500 hover:bg-pink-200'
              }`}
          >
            + Manage Special Dates
          </Link>
        </motion.div>
      </div>

      {/* Calendar Modal */}
      <AnimatePresence>
        {showCalendar && (
          <CalendarView
            specialDates={specialDates}
            onClose={() => setShowCalendar(false)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

