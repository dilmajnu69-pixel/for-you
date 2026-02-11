'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';
import Link from 'next/link';


interface Photo {
  id: number;
  src: string;
  caption: string;
  date: string;
}

/**
 * Helper to transform Google Drive direct links into proxy links
 */
const getImageSrc = (src: string, useFallback: boolean = false) => {
  if (src.includes('drive.google.com') && !useFallback) {
    try {
      const url = new URL(src);
      const id = url.searchParams.get('id');
      if (id) return `/api/drive-proxy?id=${id}`;
    } catch (e) {
      console.error('Invalid URL in getImageSrc:', src);
    }
  }
  return src;
};

export default function GalleryPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { photos } = useData();

  // Reset loading state when photo changes
  useEffect(() => {
    setIsLoading(true);
  }, [currentIndex]);

  const nextPhoto = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const prevPhoto = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const goToPhoto = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  // Auto-advance slideshow
  useEffect(() => {
    if (!isAutoPlaying || photos.length <= 1) return;

    const timer = setInterval(nextPhoto, 4000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, photos.length, nextPhoto]);

  const currentPhoto = photos[currentIndex];

  if (photos.length === 0) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">

        <div className={`text-center z-10 ${isDark ? 'text-pink-300' : 'text-rose-600'}`}>
          <p className="text-xl mb-4">No photos yet! 📸</p>
          <p className="text-sm opacity-70 mb-6">Start building your collection now.</p>
          <div className="flex flex-col gap-4 items-center">
            <Link
              href="/manage/gallery"
              className={`px-6 py-3 rounded-full font-medium transition-transform hover:scale-105 active:scale-95 shadow-lg ${isDark
                ? 'bg-pink-500 text-white hover:bg-pink-400'
                : 'bg-rose-500 text-white hover:bg-rose-600'
                }`}
            >
              + Add Your First Photo
            </Link>
            <Link href="/" className="text-sm underline hover:no-underline opacity-80 hover:opacity-100">
              ← Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Back button */}
      <Link
        href="/"
        className={`absolute top-4 left-4 md:top-6 md:left-6 z-20 text-sm transition-colors duration-300 ${isDark ? 'text-purple-300 hover:text-pink-300' : 'text-rose-500 hover:text-rose-700'
          }`}
      >
        ← Back to Home
      </Link>

      <div className="w-full max-w-4xl mx-auto z-10">
        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-2xl md:text-4xl font-bold text-center mb-8 transition-colors duration-300 ${isDark ? 'text-pink-300' : 'text-rose-700'
            }`}
        >
          Our Memories 📸✨
        </motion.h1>

        {/* Photo display with external navigation */}
        <div className="flex items-center gap-4">
          {/* Left navigation button */}
          {photos.length > 1 && (
            <button
              onClick={() => { prevPhoto(); setIsAutoPlaying(false); }}
              className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 text-xl ${isDark
                ? 'bg-slate-800/70 hover:bg-pink-500/70 text-white border border-purple-500/30'
                : 'bg-white/80 hover:bg-pink-500 hover:text-white text-rose-600 border border-pink-200'
                } backdrop-blur-sm shadow-lg`}
              aria-label="Previous photo"
            >
              ‹
            </button>
          )}

          {/* Photo container */}
          <div className="relative flex-1 aspect-[4/3] md:aspect-video rounded-2xl overflow-hidden shadow-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                {currentPhoto.src ? (
                  <>
                    {/* Blurred Background for "Fill" effect */}
                    <div className="absolute inset-0 z-0">
                      <img
                        src={getImageSrc(currentPhoto.src, failedImages[currentPhoto.id])}
                        alt=""
                        className="w-full h-full object-cover blur-2xl opacity-40 scale-110"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Loading Spinner */}
                    {isLoading && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center">
                        <div className={`w-10 h-10 border-4 border-t-transparent rounded-full animate-spin ${isDark ? 'border-pink-400' : 'border-rose-500'
                          }`}></div>
                      </div>
                    )}

                    {/* Main Image - Fully Visible */}
                    <img
                      src={getImageSrc(currentPhoto.src, failedImages[currentPhoto.id])}
                      alt={currentPhoto.caption}
                      className={`relative z-10 w-full h-full object-contain drop-shadow-md transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'
                        }`}
                      referrerPolicy="no-referrer"
                      onLoad={() => setIsLoading(false)}
                      onError={() => {
                        console.warn(`[Gallery] Image failed to load via proxy: ${currentPhoto.id}. Trying fallback...`);
                        if (!failedImages[currentPhoto.id]) {
                          setFailedImages(prev => ({ ...prev, [currentPhoto.id]: true }));
                        } else {
                          // Even fallback failed
                          setIsLoading(false);
                        }
                      }}
                    />
                  </>
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${isDark
                    ? 'bg-gradient-to-br from-slate-800 via-purple-900/50 to-slate-800'
                    : 'bg-gradient-to-br from-pink-100 via-rose-100 to-pink-50'
                    }`}>
                    <div className="text-center p-8">
                      <div className="text-6xl mb-4">📷</div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Caption overlay */}
            {(currentPhoto.caption || currentPhoto.date) && (
              <div className={`absolute bottom-0 left-0 right-0 p-4 md:p-6 z-20 ${isDark
                ? 'bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent'
                : 'bg-gradient-to-t from-black/70 via-black/40 to-transparent'
                }`}>
                {currentPhoto.caption && (
                  <motion.p
                    key={`caption-${currentIndex}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-white text-lg md:text-xl font-medium drop-shadow-md"
                  >
                    {currentPhoto.caption}
                  </motion.p>
                )}
                {currentPhoto.date && (
                  <p className="text-white/80 text-sm mt-1 drop-shadow-sm">
                    {new Date(currentPhoto.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right navigation button */}
          {photos.length > 1 && (
            <button
              onClick={() => { nextPhoto(); setIsAutoPlaying(false); }}
              className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 text-xl ${isDark
                ? 'bg-slate-800/70 hover:bg-pink-500/70 text-white border border-purple-500/30'
                : 'bg-white/80 hover:bg-pink-500 hover:text-white text-rose-600 border border-pink-200'
                } backdrop-blur-sm shadow-lg`}
              aria-label="Next photo"
            >
              ›
            </button>
          )}
        </div>

        {/* Dot indicators */}
        {photos.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            {photos.map((_, index) => (
              <button
                key={index}
                onClick={() => goToPhoto(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentIndex
                  ? isDark ? 'bg-pink-400 w-6' : 'bg-rose-500 w-6'
                  : isDark ? 'bg-purple-500/50 hover:bg-purple-400' : 'bg-pink-300 hover:bg-pink-400'
                  }`}
                aria-label={`Go to photo ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Play/Pause button */}
        {photos.length > 1 && (
          <div className="text-center mt-4">
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className={`text-sm px-4 py-2 rounded-full transition-all duration-300 ${isDark
                ? 'bg-purple-900/50 text-purple-300 hover:bg-purple-800/50'
                : 'bg-pink-100 text-rose-500 hover:bg-pink-200'
                }`}
            >
              {isAutoPlaying ? '⏸ Pause' : '▶ Play'} Slideshow
            </button>
          </div>
        )}

        {/* Photo counter */}
        <p className={`text-center mt-4 text-sm ${isDark ? 'text-purple-300/60' : 'text-pink-400'}`}>
          {currentIndex + 1} of {photos.length}
        </p>

        {/* Manage link */}
        <div className="text-center mt-6">
          <Link
            href="/manage/gallery"
            className={`inline-block text-xs px-4 py-2 rounded-xl transition-colors ${isDark
              ? 'bg-purple-800/50 text-purple-300 hover:bg-purple-700/50'
              : 'bg-pink-100 text-rose-500 hover:bg-pink-200'
              }`}
          >
            + Add Photos
          </Link>
        </div>
      </div>
    </main>
  );
}
