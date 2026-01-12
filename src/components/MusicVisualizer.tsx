'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';

/**
 * Global Music Visualizer Component.
 * 
 * Renders floating particles (bubbles/sparkles) when `isVisualizerActive` is true in ThemeContext.
 * This component is rendered globally in ClientLayout to persist across page navigation.
 */
export default function MusicVisualizer() {
  const { theme, isVisualizerActive } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div className={`absolute inset-0 opacity-30 ${isDark ? 'bg-slate-900' : 'bg-pink-50'}`} />

      {/* Floating Particles (Bubbles) when active */}
      {isVisualizerActive && (
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              initial={{ y: "110vh", x: (i * 13) % 100 + "vw", opacity: 0 }}
              animate={{
                y: "-10vh",
                opacity: [0, 0.8, 0],
                scale: [0.5, 1.2, 0.5]
              }}
              transition={{
                duration: 5 + (i % 7), // Varied duration
                repeat: Infinity,
                delay: i * 0.5,
                ease: "linear"
              }}
              className={`absolute w-3 h-3 rounded-full blur-[2px] ${isDark ? 'bg-purple-400' : 'bg-rose-400'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
