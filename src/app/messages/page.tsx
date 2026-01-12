'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import RomanticButton from '@/components/RomanticButton';
import PastelEmoji from '@/components/PastelEmoji';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';

interface Message {
  id: number;
  text: string;
  type: string;
}

export default function MessagesPage() {
  const { messages } = useData();
  const [currentMessage, setCurrentMessage] = useState<Message | null>(null);
  const [key, setKey] = useState(0);
  const [progress, setProgress] = useState(0);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const getRandomMessage = useCallback(() => {
    if (messages.length === 0) return;

    let randomIndex: number;
    if (messages.length > 1 && currentMessage) {
      do {
        randomIndex = Math.floor(Math.random() * messages.length);
      } while (messages[randomIndex].id === currentMessage.id);
    } else {
      randomIndex = Math.floor(Math.random() * messages.length);
    }

    setCurrentMessage(messages[randomIndex]);
    setKey(prev => prev + 1);
    setProgress(0);
  }, [messages, currentMessage]);

  useEffect(() => {
    if (messages.length > 0 && !currentMessage) {
      const randomIndex = Math.floor(Math.random() * messages.length);
      // eslint-disable-next-line
      setCurrentMessage(messages[randomIndex]);
    }
  }, [messages, currentMessage]);

  useEffect(() => {
    const duration = 15000;
    const interval = 50;
    const increment = (100 / duration) * interval;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          getRandomMessage();
          return 0;
        }
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [getRandomMessage]);

  const handleButtonClick = () => {
    getRandomMessage();
  };

  return (
    <main className="min-h-screen relative overflow-hidden">


      <div className="relative z-10 px-4 py-8 max-w-2xl mx-auto min-h-screen flex flex-col items-center justify-center">
        {/* Back to Home - Fixed top left */}
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
          className="text-center mb-8"
        >
          <h1 className={`text-2xl md:text-4xl lg:text-5xl font-semibold mb-4 transition-colors duration-300 ${isDark ? 'text-pink-300' : 'text-rose-700'
            }`}>
            Special Message 💌
          </h1>
        </motion.div>

        {/* Single Message Card with Animated Border */}
        <div className="w-full mb-8">
          <AnimatePresence mode="wait">
            {currentMessage && (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 0.95 }}
                transition={{
                  duration: 0.5,
                  ease: 'easeOut',
                }}
                className="relative p-[3px] rounded-3xl"
                style={{
                  background: `conic-gradient(from 0deg, ${isDark ? '#a855f7' : '#e11d48'} ${progress}%, transparent ${progress}%, transparent 100%)`,
                }}
              >
                {/* Inner card */}
                <div className={`relative overflow-hidden rounded-3xl p-6 md:p-8 lg:p-12 shadow-xl backdrop-blur-sm transition-colors duration-300 ${isDark
                  ? 'bg-gradient-to-br from-slate-800/90 via-purple-900/80 to-slate-800/90 border border-purple-500/20'
                  : 'bg-gradient-to-br from-pink-100 via-rose-50 to-pink-50'
                  }`}>
                  {/* Decorative elements */}
                  <div className={`absolute top-3 right-3 md:top-4 md:right-4 ${isDark ? 'opacity-60' : ''}`}>
                    <PastelEmoji emoji="💗" size="md" />
                  </div>
                  <div className={`absolute bottom-3 left-3 md:bottom-4 md:left-4 ${isDark ? 'opacity-40' : ''}`}>
                    <PastelEmoji emoji="✿" size="sm" />
                  </div>
                  <div className={`absolute top-3 left-3 md:top-4 md:left-4 ${isDark ? 'opacity-40' : ''}`}>
                    <PastelEmoji emoji="🌸" size="sm" />
                  </div>
                  <div className={`absolute bottom-3 right-3 md:bottom-4 md:right-4 ${isDark ? 'opacity-60' : ''}`}>
                    <PastelEmoji emoji="💕" size="md" />
                  </div>

                  {/* Content */}
                  <div className="relative z-10 py-4">
                    <p className={`text-lg md:text-xl lg:text-2xl font-medium leading-relaxed text-center italic transition-colors duration-300 ${isDark ? 'text-pink-200' : 'text-rose-800'
                      }`}>
                      &ldquo;{currentMessage.text}&rdquo;
                    </p>
                  </div>

                  {/* Type badge */}
                  {currentMessage.type && (
                    <div className={`absolute top-3 left-1/2 -translate-x-1/2 text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-purple-800/50 text-purple-300' : 'bg-pink-200 text-rose-600'
                      }`}>
                      {currentMessage.type}
                    </div>
                  )}

                  {/* Bottom decorative line */}
                  <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1 rounded-full transition-colors duration-300 ${isDark
                    ? 'bg-gradient-to-r from-transparent via-purple-400 to-transparent'
                    : 'bg-gradient-to-r from-transparent via-pink-300 to-transparent'
                    }`} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Random message button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <RomanticButton onClick={handleButtonClick} variant="primary">
            ✨ Show me another message 💖
          </RomanticButton>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className={`text-center mt-12 text-sm font-sans transition-colors duration-300 ${isDark ? 'text-purple-300/60' : 'text-pink-400'}`}
        >
          <p className="mb-2">🌸 With all my love 🌸</p>
          <Link
            href="/manage/messages"
            className={`inline-block text-xs px-4 py-2 rounded-xl transition-colors ${isDark
              ? 'bg-purple-800/50 text-purple-300 hover:bg-purple-700/50'
              : 'bg-pink-100 text-rose-500 hover:bg-pink-200'
              }`}
          >
            + Add More Messages
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
