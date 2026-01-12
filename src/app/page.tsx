'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

import PastelEmoji from '@/components/PastelEmoji';
import { useTheme } from '@/context/ThemeContext';
import Link from 'next/link';
import petNamesData from '@/../data/pet-names.json';
import { APP_CONFIG } from '@/config/constants';

interface FeatureCardProps {
  title: string;
  description: string;
  emoji: string;
  href: string;
  index: number;
  isDark: boolean;
}

function FeatureCard({ title, description, emoji, href, index, isDark }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
    >
      <Link href={href} className="block group">
        <div className={`relative overflow-hidden rounded-2xl p-6 h-full transition-all duration-300 cursor-pointer
          ${isDark
            ? 'bg-gradient-to-br from-slate-800/80 via-purple-900/50 to-slate-800/80 border border-purple-500/30 hover:border-pink-400/50 hover:shadow-lg hover:shadow-pink-500/20'
            : 'bg-gradient-to-br from-white/80 via-pink-50/80 to-rose-50/80 border border-pink-200/60 hover:border-pink-300 hover:shadow-lg hover:shadow-pink-200/40'
          }
          backdrop-blur-sm
        `}>
          {/* Emoji */}
          <motion.div
            className="mb-4"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <PastelEmoji emoji={emoji} size="lg" />
          </motion.div>

          {/* Title */}
          <h3 className={`text-lg md:text-xl font-semibold mb-2 transition-colors duration-300 ${isDark ? 'text-pink-300 group-hover:text-pink-200' : 'text-rose-700 group-hover:text-rose-600'
            }`}>
            {title}
          </h3>

          {/* Description */}
          <p className={`text-sm leading-relaxed transition-colors duration-300 ${isDark ? 'text-purple-300/70' : 'text-rose-500/70'
            }`}>
            {description}
          </p>


        </div>
      </Link>
    </motion.div>
  );
}



export default function Home() {
  // State for dynamic personalized greeting
  const [petName, setPetName] = useState('Beautiful');
  const { theme, toggleVisualizer, isVisualizerActive } = useTheme();
  const isDark = theme === 'dark';

  // Effect: Select a random cute name on mount
  useEffect(() => {
    const names = petNamesData.petNames;
    const randomIndex = Math.floor(Math.random() * names.length);
    // eslint-disable-next-line
    setPetName(names[randomIndex]);
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden pointer-events-none">


      {/* Main Content Container with Entry Animation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="text-center max-w-3xl mx-auto z-10 pointer-events-auto"
      >
        {/* Decorative Floating Heart Animation */}
        {/* Decorative Floating Heart Animation - Click to toggle visualizer */}
        <motion.button
          onClick={toggleVisualizer}
          whileHover={{ scale: 1.2, rotate: 15 }}
          whileTap={{ scale: 0.9 }}
          animate={{
            y: [0, -10, 0],
            filter: isVisualizerActive
              ? [`drop-shadow(0 0 10px ${isDark ? '#a855f7' : '#f43f5e'})`, `drop-shadow(0 0 20px ${isDark ? '#a855f7' : '#f43f5e'})`, `drop-shadow(0 0 10px ${isDark ? '#a855f7' : '#f43f5e'})`]
              : 'drop-shadow(0 0 0px transparent)'
          }}
          transition={{
            y: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
            filter: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
          }}
          className="text-5xl md:text-6xl mb-4 md:mb-6 cursor-pointer focus:outline-none z-50 relative"
          title={isVisualizerActive ? "Turn off music visualizer" : "Turn on music visualizer"}
        >
          {isVisualizerActive ? '🎈' : '💕'}
        </motion.button>

        {/* Dynamic Personalized Greeting */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className={`text-3xl md:text-4xl lg:text-6xl font-semibold mb-4 md:mb-6 leading-tight transition-colors duration-300 ${isDark ? 'text-pink-300' : 'text-rose-700'
            }`}
        >
          Hello, {petName}
        </motion.h1>

        {/* Romantic Subtitle Message */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className={`text-base md:text-lg lg:text-xl mb-8 md:mb-10 font-sans leading-relaxed px-2 transition-colors duration-300 ${isDark ? 'text-pink-200/80' : 'text-rose-600/80'
            }`}
        >
          I created this little corner of the internet just for you.
        </motion.p>

        {/* Feature Cards Grid - Links to main app sections */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-8">
          {APP_CONFIG.FEATURES.map((feature, index) => {
            const isLastOdd = APP_CONFIG.FEATURES.length % 2 === 1 && index === APP_CONFIG.FEATURES.length - 1;
            return (
              <div key={feature.href} className={isLastOdd ? 'sm:col-span-2 sm:max-w-[50%] sm:mx-auto' : ''}>
                <FeatureCard
                  {...feature}
                  index={index}
                  isDark={isDark}
                />
              </div>
            );
          })}
        </div>

        {/* Bottom decoration */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className={`mt-8 text-sm font-sans transition-colors duration-300 ${isDark ? 'text-purple-300/60' : 'text-pink-300'
            }`}
        >
          ✿ Made with love, for you ✿
        </motion.div>
      </motion.div>
    </main>
  );
}
