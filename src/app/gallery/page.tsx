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
  if (!src) return '';

  // Extract Drive ID if it's a Google Drive link
  let driveId = '';
  if (src.includes('drive.google.com')) {
    try {
      const url = new URL(src);
      driveId = url.searchParams.get('id') || '';
    } catch (e) { }
  }

  // Use Proxy as primary method
  if (driveId && !useFallback) {
    return `/api/drive-proxy?id=${driveId}`;
  }

  // Use reliable public direct link as secondary fallback
  if (driveId && useFallback) {
    return `https://lh3.googleusercontent.com/d/${driveId}`;
  }

  return src;
};

export default function GalleryPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});
  const [proxyError, setProxyError] = useState<any>(null);
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});
  const [progress, setProgress] = useState(0);
  const [key, setKey] = useState(0);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { photos } = useData();

  const nextPhoto = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
    setKey(prev => prev + 1);
    setProgress(0);
  }, [photos.length]);

  const prevPhoto = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
    setKey(prev => prev + 1);
    setProgress(0);
  };

  const goToPhoto = (index: number) => {
    setCurrentIndex(index);
    setKey(prev => prev + 1);
    setProgress(0);
    setIsAutoPlaying(false);
  };

  // Auto-advance slideshow with progress
  useEffect(() => {
    if (!isAutoPlaying || photos.length <= 1) return;

    const duration = 15000; // 15 seconds as requested
    const interval = 50;
    const increment = (100 / duration) * interval;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          nextPhoto();
          return 0;
        }
        return prev + increment;
      });
    }, interval);

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

          {/* Photo container with animated border */}
          <div
            className="relative flex-1 p-[3px] rounded-3xl"
            style={{
              background: `conic-gradient(from 0deg, ${isDark ? '#a855f7' : '#e11d48'} ${progress}%, transparent ${progress}%, transparent 100%)`,
            }}
          >
            <div className={`relative w-full h-full aspect-[4/3] md:aspect-video rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm transition-colors duration-300 ${isDark
              ? 'bg-gradient-to-br from-slate-800/90 via-purple-900/80 to-slate-800/90'
              : 'bg-gradient-to-br from-pink-100 via-rose-50 to-pink-50'
              }`}>
              {photos.map((photo, index) => {
                const isActive = index === currentIndex;
                const isLoaded = loadedImages[photo.id];
                const isFailed = failedImages[photo.id];

                return (
                  <motion.div
                    key={photo.id}
                    initial={false}
                    animate={{
                      opacity: isActive ? 1 : 0,
                      scale: isActive ? 1 : 1.05,
                      zIndex: isActive ? 10 : 0,
                    }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="absolute inset-0"
                    style={{
                      pointerEvents: isActive ? 'auto' : 'none',
                      visibility: (isActive || index === (currentIndex + 1) % photos.length || index === (currentIndex - 1 + photos.length) % photos.length) ? 'visible' : 'hidden'
                    }}
                  >
                    {photo.src ? (
                      <>
                        {/* Blurred Background for "Fill" effect */}
                        <div className="absolute inset-0 z-0">
                          <img
                            src={getImageSrc(photo.src, isFailed)}
                            alt=""
                            className="w-full h-full object-cover blur-2xl opacity-40 scale-110"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        {/* Loading Spinner (only for active image if not yet loaded) */}
                        {isActive && !isLoaded && !isFailed && (
                          <div className="absolute inset-0 z-20 flex items-center justify-center">
                            <div className={`w-10 h-10 border-4 border-t-transparent rounded-full animate-spin ${isDark ? 'border-pink-400' : 'border-rose-500'
                              }`}></div>
                          </div>
                        )}

                        {/* Main Image */}
                        <img
                          src={getImageSrc(photo.src, isFailed)}
                          alt={photo.caption}
                          className={`relative z-10 w-full h-full object-contain drop-shadow-md transition-opacity duration-300 ${isActive && !isLoaded ? 'opacity-0' : 'opacity-100'
                            }`}
                          referrerPolicy="no-referrer"
                          onLoad={() => setLoadedImages(prev => ({ ...prev, [photo.id]: true }))}
                          onError={async () => {
                            if (!isFailed) {
                              if (isActive && !proxyError) {
                                try {
                                  const res = await fetch(getImageSrc(photo.src));
                                  if (!res.ok) {
                                    const errorData = await res.json();
                                    setProxyError(errorData);
                                  }
                                } catch (e) { }
                              }
                              setFailedImages(prev => ({ ...prev, [photo.id]: true }));
                            }
                          }}
                        />

                        {/* Overlay Error Message */}
                        {isActive && proxyError && (
                          <div className="absolute inset-x-0 top-0 z-30 p-2 bg-red-500/90 text-white text-[10px] text-center backdrop-blur-sm">
                            ⚠️ Drive Connection Issue: <strong>{proxyError.attempts?.[0]?.message || proxyError.details || 'unknown'}</strong>.
                            Check your Vercel Environment Variables.
                          </div>
                        )}
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
                );
              })}

              {/* Shared Caption overlay */}
              {(currentPhoto?.caption || currentPhoto?.date) && (
                <div className={`absolute bottom-0 left-0 right-0 p-4 md:p-6 z-20 ${isDark
                  ? 'bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent'
                  : 'bg-gradient-to-t from-black/70 via-black/40 to-transparent'
                  }`}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.3 }}
                    >
                      {currentPhoto.caption && (
                        <p className="text-white text-lg md:text-xl font-medium drop-shadow-md">
                          {currentPhoto.caption}
                        </p>
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
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}
            </div>
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
