'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';
import { toast } from 'react-hot-toast';

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
  const { loveLetter } = useData();
  const isDark = theme === 'dark';

  const [clickCount, setClickCount] = useState(0);
  const [showScroll, setShowScroll] = useState(false);

  const handlePandaClick = () => {
    if (!enableInteractivity || showScroll) return;

    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (newCount === 11) {
      setShowScroll(true);
      setClickCount(0); // Reset after success
      toast.success('You found it! ❤️', { icon: '📜', duration: 3000 });
    } else {
      // Use toast for feedback
      const remaining = 11 - newCount;
      if (newCount > 3) {
        toast(`Keep clicking... ${remaining} more!`, {
          icon: '🐼',
          id: 'panda-click', // Prevent multiple toasts stacking
          duration: 1000
        });
      }
    }
  };

  return (
    <>
      {/* Premium Romantic Letter Modal */}
      <AnimatePresence>
        {showScroll && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowScroll(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-md cursor-pointer pointer-events-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40, rotate: 2 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className={`relative w-full max-w-2xl rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden max-h-[85vh] flex flex-col transition-colors duration-500 ${isDark ? 'bg-[#2a1a2a] border-purple-500/30' : 'bg-[#fffcf5] border-pink-200'
                } border-8`}
              style={{
                backgroundImage: isDark
                  ? 'url("https://www.transparenttextures.com/patterns/dark-matter.png")'
                  : 'url("https://www.transparenttextures.com/patterns/stitched-wool.png")',
              }}
            >
              {/* Decorative Border Inner */}
              <div className={`absolute inset-2 border transition-colors duration-500 ${isDark ? 'border-purple-400/20' : 'border-pink-300/30'} pointer-events-none`} />

              {/* Decorative Hearts in background */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      y: [0, -100],
                      x: [0, Math.sin(i) * 20],
                      opacity: [0, 1, 0],
                      scale: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 5 + i,
                      repeat: Infinity,
                      delay: i * 0.8,
                      ease: "linear"
                    }}
                    className="absolute text-2xl"
                    style={{
                      left: `${15 + i * 15}%`,
                      bottom: "-10%"
                    }}
                  >
                    ❤️
                  </motion.div>
                ))}
              </div>

              {/* Header Decorative Element */}
              <div className="pt-8 pb-4 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                  className="inline-block"
                >
                  <span className="text-4xl">💌</span>
                </motion.div>
              </div>

              {/* Content area */}
              <div className={`flex-1 overflow-y-auto px-6 md:px-12 pb-12 transition-colors duration-500 ${isDark ? 'text-pink-100' : 'text-rose-900'} scrollbar-hide`}>
                <h2 className={`text-3xl md:text-4xl font-serif font-bold text-center mb-8 tracking-wide transition-colors duration-500 ${isDark ? 'text-pink-300' : 'text-rose-800'}`}>
                  {loveLetter.title}
                </h2>

                <div className="space-y-6 font-serif text-lg md:text-xl leading-relaxed italic text-justify">
                  {loveLetter.paragraphs.map((paragraph: string, index: number) => (
                    <motion.p
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.2 }}
                    >
                      {paragraph}
                    </motion.p>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                  className="mt-12 text-center"
                >
                  <div className={`w-24 h-px mx-auto mb-6 transition-colors duration-500 ${isDark ? 'bg-purple-500/50' : 'bg-pink-300/50'}`} />
                  <p className="text-2xl font-serif italic">
                    {loveLetter.signature}
                  </p>

                  {/* Decorative "Wax Seal" */}
                  <div className="mt-8 flex justify-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors duration-500 ${isDark ? 'bg-purple-700 text-pink-200' : 'bg-rose-600 text-white'
                      }`}>
                      ❤️
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowScroll(false)}
                className={`absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 ${isDark ? 'bg-purple-900/50 text-purple-300 hover:bg-purple-800' : 'bg-pink-100 text-rose-500 hover:bg-pink-200'
                  }`}
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
          className="absolute bottom-20 right-8 md:bottom-24 md:right-16 z-50"
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
      </div >
    </>
  );
}
