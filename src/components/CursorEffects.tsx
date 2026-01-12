'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import PastelEmoji from './PastelEmoji';

interface Particle {
  id: number;
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  emoji: string;
}

const TRAIL_EMOJIS = ['✨', '💖', '🌸', '💫', '💕'];
const BURST_EMOJIS = ['💝', '💖', '💗', '💓', '💞', '💘'];

/**
 * Global Cursor Effects Component.
 * 
 * Adds a magical feel to the application with two main effects:
 * 1. Mouse Trail: Particles following the cursor.
 * 2. Click Burst: Explosion of hearts on click.
 */
export default function CursorEffects() {
  const [trail, setTrail] = useState<Particle[]>([]);
  const [bursts, setBursts] = useState<Particle[]>([]);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Handle mouse movement for trail
  useEffect(() => {
    let mouseX = 0;
    let mouseY = 0;
    let lastTime = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      const now = Date.now();
      // Throttle trail creation
      if (now - lastTime > 50) {
        lastTime = now;
        const id = now;
        const emoji = TRAIL_EMOJIS[Math.floor(Math.random() * TRAIL_EMOJIS.length)];

        setTrail(prev => [...prev.slice(-15), { id, x: mouseX, y: mouseY, emoji }]);

        // Cleanup old particle automatically
        setTimeout(() => {
          setTrail(prev => prev.filter(p => p.id !== id));
        }, 1000);
      }
    };

    const handleClick = (e: MouseEvent) => {
      const now = Date.now();
      const newBursts: Particle[] = [];

      // Create explosion of hearts
      for (let i = 0; i < 8; i++) {
        newBursts.push({
          id: now + i,
          x: e.clientX,
          y: e.clientY,
          targetX: e.clientX + (Math.random() - 0.5) * 100,
          targetY: e.clientY + (Math.random() - 0.5) * 100,
          emoji: BURST_EMOJIS[Math.floor(Math.random() * BURST_EMOJIS.length)]
        });
      }

      setBursts(prev => [...prev, ...newBursts]);

      // Cleanup bursts
      setTimeout(() => {
        setBursts(prev => prev.filter(p => p.id < now)); // Clear these specific bursts
      }, 1000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      <AnimatePresence>
        {/* Trail */}
        {trail.map(particle => (
          <motion.div
            key={particle.id}
            initial={{ opacity: 0.8, scale: 0.5, x: particle.x, y: particle.y }}
            animate={{
              opacity: 0,
              scale: 0,
              y: particle.y + 20 // Fall down slightly
            }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute top-0 left-0 pointer-events-none"
            style={{
              filter: isDark ? 'drop-shadow(0 0 2px rgba(255,255,255,0.5))' : 'none'
            }}
          >
            <span className="text-sm select-none">{particle.emoji}</span>
          </motion.div>
        ))}

        {/* Click Bursts */}
        {bursts.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ opacity: 1, scale: 0.5, x: particle.x, y: particle.y }}
            animate={{
              opacity: 0,
              scale: 1.5,
              x: particle.targetX,
              y: particle.targetY
            }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute top-0 left-0 pointer-events-none"
          >
            <PastelEmoji emoji={particle.emoji} size="md" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
