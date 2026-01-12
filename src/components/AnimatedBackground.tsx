'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useTheme } from '@/context/ThemeContext';
import loveLetterData from '@/../data/love-letter.json';

interface AnimatedBackgroundProps {
  enableInteractivity?: boolean;
}

/**
 * Interactive Animated Background.
 * 
 * Renders moving gradients and shapes using a canvas or div elements.
 * Supports interactivity via mouse position when `enableInteractivity` is true.
 */
export default function AnimatedBackground({ enableInteractivity = false }: { enableInteractivity?: boolean }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [clickCount, setClickCount] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [showScroll, setShowScroll] = useState(false);

  const handlePandaClick = () => {
    if (!enableInteractivity || showScroll) return;

    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (newCount === 11) {
      setShowScroll(true);
      setClickCount(0); // Reset after success
      setShowToast(false);
    } else {
      // Show toast on clicks 1-10
      setShowToast(true);
      // Hide toast after 0.5s
      setTimeout(() => setShowToast(false), 500);
    }
  };

  return (
    <>
      {/* Ancient Scroll Modal */}
      <AnimatePresence>
        {showScroll && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowScroll(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm cursor-pointer pointer-events-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg bg-[#f4e4bc] p-8 md:p-12 rounded-lg shadow-2xl overflow-hidden"
              style={{
                backgroundImage: 'url("https://www.transparenttextures.com/patterns/aged-paper.png"), linear-gradient(to bottom, #f4e4bc, #e6d2a0)',
                boxShadow: '0 0 20px rgba(0,0,0,0.3), inset 0 0 60px rgba(160, 100, 40, 0.3)'
              }}
            >
              {/* Scroll Rollers */}
              <div className="absolute top-0 left-0 right-0 h-6 bg-[#8b5a2b] shadow-md rounded-full -mt-3" />
              <div className="absolute bottom-0 left-0 right-0 h-6 bg-[#8b5a2b] shadow-md rounded-full -mb-3" />

              {/* Content */}
              <div className="text-center font-serif text-[#5c3a1e]">
                <h2 className="text-3xl font-bold mb-4 border-b-2 border-[#5c3a1e]/20 pb-2">{loveLetterData.title}</h2>
                {loveLetterData.paragraphs.map((paragraph, index) => (
                  <p key={index} className="text-lg leading-relaxed mb-6 italic">
                    {paragraph}
                  </p>
                ))}
                <p className="text-sm opacity-70">
                  {loveLetterData.signature}
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowScroll(false)}
                className="absolute top-4 right-4 text-[#5c3a1e]/50 hover:text-[#5c3a1e] transition-colors"
              >
                ✕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-40 px-6 py-3 rounded-full shadow-xl text-sm font-medium backdrop-blur-md transition-colors duration-300
              ${isDark
                ? 'bg-slate-800/90 text-pink-200 border border-purple-500/30'
                : 'bg-white/90 text-rose-600 border border-pink-200 shadow-pink-200/50'
              }`}
          >
            {clickCount < 10 ? `Click ${11 - clickCount} times more...` : "Almost there..."}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed inset-0 -z-10 overflow-hidden transition-colors duration-300">
        {/* Base gradient layer
          Changes smoothly between light (pink/rose) and dark (purple/slate) themes
      */}
        <div
          className={`absolute inset-0 transition-colors duration-500 ${isDark
            ? 'bg-gradient-to-br from-purple-900/90 via-slate-900 to-purple-950'
            : 'bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100'
            }`}
        />

        {/* Animated Floating Orbs
          These create the soft, dreamy background effect using blur and slow movement
      */}

        {/* Orb 1: Top Left */}
        <motion.div
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -40, 20, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className={`absolute top-10 left-5 md:top-20 md:left-20 w-48 md:w-96 h-48 md:h-96 rounded-full blur-3xl transition-colors duration-500 ${isDark
            ? 'bg-gradient-to-br from-purple-600/30 to-pink-600/20'
            : 'bg-gradient-to-br from-pink-200/40 to-rose-300/30'
            }`}
        />

        {/* Orb 2: Bottom Right */}
        <motion.div
          animate={{
            x: [0, -40, 30, 0],
            y: [0, 30, -40, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className={`absolute bottom-10 right-5 md:bottom-20 md:right-20 w-40 md:w-80 h-40 md:h-80 rounded-full blur-3xl transition-colors duration-500 ${isDark
            ? 'bg-gradient-to-br from-pink-600/30 to-purple-700/20'
            : 'bg-gradient-to-br from-purple-200/40 to-pink-300/30'
            }`}
        />

        {/* Orb 3: Center */}
        <motion.div
          animate={{
            x: [0, 20, -30, 0],
            y: [0, -20, 40, 0],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 md:w-72 h-40 md:h-72 rounded-full blur-3xl transition-colors duration-500 ${isDark
            ? 'bg-gradient-to-br from-violet-600/30 to-fuchsia-600/20'
            : 'bg-gradient-to-br from-rose-100/50 to-pink-200/40'
            }`}
        />

      </div>

      {/* 
          Interactive/Decorative Layer 
          Positioned at z-0 so it sits ABOVE the background (-z-10) but BEHIND content (z-10).
          pointer-events-none ensures clicks pass through to background unless explicitly re-enabled on children.
      */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Cute Panda - top left with gentle rotation */}
        <motion.div
          animate={{
            y: [0, -15, 0],
            rotate: [-3, 3, -3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          onClick={handlePandaClick}
          className={`absolute top-20 left-8 md:top-28 md:left-16 ${enableInteractivity ? 'cursor-default pointer-events-auto' : ''}`}
        >
          <Image
            src="/panda.png"
            alt="Cute Panda"
            width={80}
            height={80}
            priority
            className={`drop-shadow-lg w-[80px] h-[80px] md:w-[130px] md:h-[130px] transition-opacity duration-300 ${isDark ? 'opacity-60' : 'opacity-80'
              }`}
          />
        </motion.div>

        {/* Cute Duck - bottom right with counter-rotation */}
        <motion.div
          animate={{
            y: [0, -12, 0],
            rotate: [3, -3, 3],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.5,
          }}
          className="absolute bottom-8 right-8 md:bottom-16 md:right-16"
        >
          <Image
            src="/duck.png"
            alt="Cute Duck"
            width={70}
            height={70}
            className={`drop-shadow-lg w-[70px] h-[70px] md:w-[120px] md:h-[120px] transition-opacity duration-300 ${isDark ? 'opacity-60' : 'opacity-80'
              }`}
          />
        </motion.div>

        {/* Floating Emoji Characters */}
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute top-1/4 left-1/6 text-4xl ${isDark ? 'opacity-40' : 'opacity-60'}`}
        >
          💕
        </motion.div>

        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          className={`absolute top-1/3 right-1/4 text-3xl ${isDark ? 'opacity-30' : 'opacity-50'}`}
        >
          ✿
        </motion.div>

        <motion.div
          animate={{ y: [0, -25, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className={`absolute bottom-1/3 left-1/4 text-3xl ${isDark ? 'opacity-30' : 'opacity-50'}`}
        >
          🌸
        </motion.div>

        {/* Stars for dark mode */}
        {isDark && (
          <>
            <motion.div
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute top-20 right-1/3 text-xl"
            >
              ✨
            </motion.div>
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
              className="absolute top-1/3 left-1/3 text-sm"
            >
              ⭐
            </motion.div>
            <motion.div
              animate={{ opacity: [0.4, 0.9, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 1 }}
              className="absolute bottom-1/4 right-1/5 text-lg"
            >
              ✨
            </motion.div>
          </>
        )}
      </div>
    </>
  );
}
