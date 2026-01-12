'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import AnimatedBackground from '@/components/AnimatedBackground';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';
import Link from 'next/link';

export default function ManageGalleryPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { photos, addPhoto, removePhoto } = useData();

  const [srcType, setSrcType] = useState<'url' | 'upload'>('url');
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [date, setDate] = useState('');

  const handleAdd = () => {
    if (imageUrl.trim() && caption.trim() && date) {
      addPhoto(imageUrl.trim(), caption.trim(), date);
      setImageUrl('');
      setCaption('');
      setDate('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Convert to base64 for localStorage storage
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 px-4 py-8 max-w-2xl mx-auto min-h-screen">
        {/* Back button */}
        <Link
          href="/gallery"
          className={`fixed top-4 left-4 md:top-6 md:left-6 text-sm md:text-base transition-colors z-20 ${isDark ? 'text-purple-400 hover:text-purple-300' : 'text-pink-400 hover:text-pink-500'
            }`}
        >
          ← Back to Gallery
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 pt-12"
        >
          <h1 className={`text-2xl md:text-4xl font-semibold mb-4 transition-colors duration-300 ${isDark ? 'text-pink-300' : 'text-rose-700'
            }`}>
            Manage Gallery 📸
          </h1>
        </motion.div>

        {/* Add new photo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={`rounded-2xl p-6 mb-6 ${isDark
              ? 'bg-slate-800/80 border border-purple-500/30'
              : 'bg-white/80 border border-pink-200'
            }`}
        >
          <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-pink-300' : 'text-rose-700'}`}>
            Add New Photo
          </h2>

          <div className="space-y-4">
            {/* Source type toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setSrcType('url')}
                className={`flex-1 py-2 rounded-lg font-medium transition-all ${srcType === 'url'
                    ? isDark ? 'bg-pink-500 text-white' : 'bg-rose-500 text-white'
                    : isDark ? 'bg-slate-700 text-purple-300' : 'bg-pink-100 text-pink-500'
                  }`}
              >
                Web URL
              </button>
              <button
                onClick={() => setSrcType('upload')}
                className={`flex-1 py-2 rounded-lg font-medium transition-all ${srcType === 'upload'
                    ? isDark ? 'bg-pink-500 text-white' : 'bg-rose-500 text-white'
                    : isDark ? 'bg-slate-700 text-purple-300' : 'bg-pink-100 text-pink-500'
                  }`}
              >
                Upload File
              </button>
            </div>

            {/* Image source */}
            {srcType === 'url' ? (
              <div>
                <label className={`block text-sm mb-1 ${isDark ? 'text-purple-300' : 'text-pink-500'}`}>
                  Image URL
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className={`w-full p-3 rounded-xl border transition-colors ${isDark
                      ? 'bg-slate-900/50 border-purple-500/30 text-pink-100 placeholder-purple-400/50'
                      : 'bg-pink-50 border-pink-200 text-rose-800 placeholder-pink-300'
                    }`}
                />
              </div>
            ) : (
              <div>
                <label className={`block text-sm mb-1 ${isDark ? 'text-purple-300' : 'text-pink-500'}`}>
                  Upload Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className={`w-full p-3 rounded-xl border transition-colors ${isDark
                      ? 'bg-slate-900/50 border-purple-500/30 text-pink-100'
                      : 'bg-pink-50 border-pink-200 text-rose-800'
                    }`}
                />
              </div>
            )}

            {/* Image preview */}
            {imageUrl && (
              <div className={`rounded-xl overflow-hidden border ${isDark ? 'border-purple-500/30' : 'border-pink-200'
                }`}>
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-40 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="gray">Invalid Image</text></svg>';
                  }}
                />
              </div>
            )}

            <div>
              <label className={`block text-sm mb-1 ${isDark ? 'text-purple-300' : 'text-pink-500'}`}>
                Caption
              </label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="A beautiful memory..."
                className={`w-full p-3 rounded-xl border transition-colors ${isDark
                    ? 'bg-slate-900/50 border-purple-500/30 text-pink-100 placeholder-purple-400/50'
                    : 'bg-pink-50 border-pink-200 text-rose-800 placeholder-pink-300'
                  }`}
              />
            </div>

            <div>
              <label className={`block text-sm mb-1 ${isDark ? 'text-purple-300' : 'text-pink-500'}`}>
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full p-3 rounded-xl border transition-colors ${isDark
                    ? 'bg-slate-900/50 border-purple-500/30 text-pink-100'
                    : 'bg-pink-50 border-pink-200 text-rose-800'
                  }`}
              />
            </div>
          </div>

          <button
            onClick={handleAdd}
            disabled={!imageUrl.trim() || !caption.trim() || !date}
            className={`mt-6 px-6 py-2 rounded-xl font-medium transition-all ${imageUrl.trim() && caption.trim() && date
                ? isDark
                  ? 'bg-pink-500 hover:bg-pink-400 text-white'
                  : 'bg-rose-500 hover:bg-rose-400 text-white'
                : isDark
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-pink-100 text-pink-300 cursor-not-allowed'
              }`}
          >
            + Add Photo
          </button>
        </motion.div>

        {/* List of photos */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-pink-300' : 'text-rose-700'}`}>
            All Photos ({photos.length})
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {photos.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`relative rounded-xl overflow-hidden ${isDark
                    ? 'bg-slate-800/60 border border-purple-500/20'
                    : 'bg-white/60 border border-pink-200/50'
                  }`}
              >
                <div className="aspect-square relative">
                  {photo.src.startsWith('data:') || photo.src.startsWith('http') ? (
                    <img
                      src={photo.src}
                      alt={photo.caption}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-slate-700' : 'bg-pink-100'
                      }`}>
                      <span className="text-4xl">📷</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className={`text-sm font-medium truncate ${isDark ? 'text-pink-200' : 'text-rose-700'}`}>
                    {photo.caption}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-purple-400' : 'text-pink-400'}`}>
                    {new Date(photo.date).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => removePhoto(photo.id)}
                  className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isDark
                      ? 'bg-red-900/80 hover:bg-red-800 text-red-300'
                      : 'bg-red-500/80 hover:bg-red-600 text-white'
                    }`}
                >
                  ✕
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
