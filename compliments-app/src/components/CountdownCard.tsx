'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import PastelEmoji from './PastelEmoji';

interface CountdownCardProps {
  title: string;
  date: string;
  emoji: string;
  index: number;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function calculateTimeLeft(targetDate: string): TimeLeft {
  const now = new Date().getTime();
  const target = new Date(targetDate).getTime();
  let difference = target - now;

  // If the date has passed this year, calculate for next year
  if (difference < 0) {
    const nextYear = new Date(targetDate);
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    difference = nextYear.getTime() - now;
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((difference % (1000 * 60)) / 1000),
    total: difference,
  };
}

export default function CountdownCard({ title, date, emoji, index }: CountdownCardProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    // eslint-disable-next-line
    setMounted(true);
    setTimeLeft(calculateTimeLeft(date));

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(date));
    }, 1000);

    return () => clearInterval(timer);
  }, [date]);

  if (!mounted) {
    return null;
  }

  const isToday = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`relative overflow-hidden rounded-2xl p-6 shadow-lg transition-all duration-300 ${isDark
        ? 'bg-gradient-to-br from-slate-800/90 via-purple-900/60 to-slate-800/90 border border-purple-500/20'
        : 'bg-gradient-to-br from-white via-pink-50 to-rose-50 border border-pink-200/50'
        } ${isToday ? 'ring-2 ring-pink-500 animate-pulse' : ''}`}
    >
      {/* Title */}
      <h3 className={`text-xl md:text-2xl font-bold mb-4 transition-colors duration-300 ${isDark ? 'text-pink-300' : 'text-rose-700'
        }`}>
        <PastelEmoji emoji={emoji} size="md" /> {title}
      </h3>

      {/* Countdown display */}
      <div className="grid grid-cols-4 gap-2 text-center">
        {[
          { value: timeLeft.days, label: 'Days' },
          { value: timeLeft.hours, label: 'Hours' },
          { value: timeLeft.minutes, label: 'Mins' },
          { value: timeLeft.seconds, label: 'Secs' },
        ].map((item, i) => (
          <div key={i} className={`rounded-lg p-1.5 transition-colors duration-300 ${isDark ? 'bg-purple-900/50' : 'bg-pink-100/70'
            }`}>
            <motion.div
              key={item.value}
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              className={`text-base md:text-lg font-bold transition-colors duration-300 ${isDark ? 'text-pink-200' : 'text-rose-600'
                }`}
            >
              {item.value.toString().padStart(2, '0')}
            </motion.div>
            <div className={`text-[10px] transition-colors duration-300 ${isDark ? 'text-purple-300/70' : 'text-rose-400'
              }`}>
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {/* Date display */}
      <div className={`mt-4 text-sm md:text-base text-center font-medium transition-colors duration-300 ${isDark ? 'text-purple-200/80' : 'text-rose-500'
        }`}>
        {new Date(date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
      </div>

      {/* Today celebration */}
      {isToday && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-pink-500/90 to-rose-500/90 rounded-2xl"
        >
          <div className="text-center text-white">
            <div className="text-4xl mb-2">🎉</div>
            <div className="text-xl font-bold">Today!</div>
            <div className="text-sm opacity-80">{title}</div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
