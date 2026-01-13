'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedBackground from '@/components/AnimatedBackground';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';
import Link from 'next/link';

export default function ManageGalleryPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { photos, addPhoto, updatePhoto, removePhoto } = useData();

  // Add State
  const [srcType, setSrcType] = useState<'url' | 'upload'>('url');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [date, setDate] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Edit State
  const [editingPhoto, setEditingPhoto] = useState<any | null>(null);
  const [editSrcType, setEditSrcType] = useState<'url' | 'upload'>('url');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [editDate, setEditDate] = useState('');

  const handleAdd = async () => {
    if ((imageUrl.trim() || selectedFile) && caption.trim() && date) {
      setIsUploading(true);
      try {
        const source = srcType === 'upload' && selectedFile ? selectedFile : imageUrl.trim();
        const result = await addPhoto(source, caption.trim(), date);

        if (result.success) {
          setImageUrl('');
          setSelectedFile(null);
          setCaption('');
          setDate('');
          const fileInput = document.getElementById('file-upload') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
        } else {
          alert(result.error || 'Failed to save photo. Please try again.');
        }
      } catch (e) {
        console.error(e);
        alert('An error occurred.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const openEditModal = (photo: any) => {
    setEditingPhoto(photo);
    setEditCaption(photo.caption);
    setEditDate(photo.date);
    setEditImageUrl(photo.src); // Default to current src
    // Determine type
    if (photo.src.startsWith('/uploads/') || photo.src.startsWith('data:')) {
      setEditSrcType('upload'); // Assume file if local path
    } else {
      setEditSrcType('url');
    }
    setEditFile(null);
  };

  const handleEditFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async () => {
    if (!editingPhoto) return;
    setIsUploading(true);
    try {
      // If user picked a file, use it. If they entered a URL, use it. 
      // If they didn't touch image (file null, url same as original), pass null to API (keeps existing).

      let source: File | string | null = null;

      if (editSrcType === 'upload' && editFile) {
        source = editFile;
      } else if (editSrcType === 'url' && editImageUrl !== editingPhoto.src) {
        source = editImageUrl;
      }

      const result = await updatePhoto(editingPhoto.id, source, editCaption, editDate);

      if (result.success) {
        setEditingPhoto(null);
        setEditFile(null);
      } else {
        alert(result.error || 'Failed to update photo');
      }

    } catch (e) {
      console.error(e);
      alert('Update failed');
    } finally {
      setIsUploading(false);
    }
  };


  return (
    <main className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 px-4 py-8 max-w-2xl mx-auto min-h-screen">
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
          className="text-center mb-8 pt-12"
        >
          <h1 className={`text-2xl md:text-4xl font-semibold mb-4 transition-colors duration-300 ${isDark ? 'text-pink-300' : 'text-rose-700'}`}>
            Manage Gallery 📸
          </h1>
        </motion.div>

        {/* Add Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-6 mb-6 ${isDark ? 'bg-slate-800/80 border border-purple-500/30' : 'bg-white/80 border border-pink-200'}`}
        >
          {/* ... Input Fields (Reusable logic, simplified for brevity here, but fully implemented below) ... */}
          {/* Copying existing Add Form logic */}
          <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-pink-300' : 'text-rose-700'}`}>Add New Photo</h2>
          <div className="space-y-4">
            <div className="flex gap-2">
              <button onClick={() => setSrcType('url')} className={`flex-1 py-2 rounded-lg font-medium transition-all ${srcType === 'url' ? (isDark ? 'bg-pink-500 text-white' : 'bg-rose-500 text-white') : (isDark ? 'bg-slate-700 text-purple-300' : 'bg-pink-100 text-pink-500')}`}>Web URL</button>
              <button onClick={() => setSrcType('upload')} className={`flex-1 py-2 rounded-lg font-medium transition-all ${srcType === 'upload' ? (isDark ? 'bg-pink-500 text-white' : 'bg-rose-500 text-white') : (isDark ? 'bg-slate-700 text-purple-300' : 'bg-pink-100 text-pink-500')}`}>Upload File</button>
            </div>

            {srcType === 'url' ? (
              <div>
                <label className={`block text-sm mb-1 ${isDark ? 'text-purple-300' : 'text-pink-500'}`}>Image URL</label>
                <input type="url" value={imageUrl} onChange={(e) => { setImageUrl(e.target.value); setSelectedFile(null); }} placeholder="https://..." className={`w-full p-3 rounded-xl border ${isDark ? 'bg-slate-900/50 border-purple-500/30 text-pink-100' : 'bg-pink-50 border-pink-200 text-rose-800'}`} />
              </div>
            ) : (
              <div>
                <label className={`block text-sm mb-1 ${isDark ? 'text-purple-300' : 'text-pink-500'}`}>Upload Image</label>
                <input id="file-upload" type="file" accept="image/*" onChange={handleFileUpload} className={`w-full p-3 rounded-xl border ${isDark ? 'bg-slate-900/50 border-purple-500/30 text-pink-100' : 'bg-pink-50 border-pink-200 text-rose-800'}`} />
              </div>
            )}

            {imageUrl && (
              <div className={`rounded-xl overflow-hidden border ${isDark ? 'border-purple-500/30' : 'border-pink-200'}`}>
                <img src={imageUrl} alt="Preview" className="w-full h-40 object-cover" onError={(e) => (e.target as HTMLImageElement).src = 'data:image/svg+xml,...'} />
              </div>
            )}

            <div><label className={`block text-sm mb-1 ${isDark ? 'text-purple-300' : 'text-pink-500'}`}>Caption</label><input type="text" value={caption} onChange={(e) => setCaption(e.target.value)} className={`w-full p-3 rounded-xl border ${isDark ? 'bg-slate-900/50 border-purple-500/30 text-pink-100' : 'bg-pink-50 border-pink-200 text-rose-800'}`} /></div>
            <div><label className={`block text-sm mb-1 ${isDark ? 'text-purple-300' : 'text-pink-500'}`}>Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`w-full p-3 rounded-xl border ${isDark ? 'bg-slate-900/50 border-purple-500/30 text-pink-100' : 'bg-pink-50 border-pink-200 text-rose-800'}`} /></div>
          </div>

          <button onClick={handleAdd} disabled={(!imageUrl.trim() && !selectedFile) || !caption.trim() || !date || isUploading} className={`mt-6 px-6 py-2 rounded-xl font-medium w-full flex justify-center items-center ${((imageUrl || selectedFile) && caption && date && !isUploading) ? (isDark ? 'bg-pink-500 text-white' : 'bg-rose-500 text-white') : (isDark ? 'bg-slate-700 text-slate-500' : 'bg-pink-100 text-pink-300')}`}>
            {isUploading ? 'Uploading...' : '+ Add Photo'}
          </button>
        </motion.div>

        {/* Photo Grid */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-pink-300' : 'text-rose-700'}`}>All Photos ({photos.length})</h2>
          <div className="grid grid-cols-2 gap-4">
            {photos.map((photo, index) => (
              <motion.div key={photo.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }} className={`relative rounded-xl overflow-hidden ${isDark ? 'bg-slate-800/60 border border-purple-500/20' : 'bg-white/60 border border-pink-200/50'}`}>
                <div className="aspect-square relative">
                  <img src={photo.src} alt={photo.caption} className="w-full h-full object-cover" />
                </div>
                <div className="p-3">
                  <p className={`text-sm font-medium truncate ${isDark ? 'text-pink-200' : 'text-rose-700'}`}>{photo.caption}</p>
                  <p className={`text-xs ${isDark ? 'text-purple-400' : 'text-pink-400'}`}>{new Date(photo.date).toLocaleDateString()}</p>
                </div>

                {/* Pen Icon (Edit) */}
                <button onClick={() => openEditModal(photo)} className={`absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors z-10 ${isDark ? 'bg-blue-900/80 hover:bg-blue-800 text-blue-300' : 'bg-blue-500/80 hover:bg-blue-600 text-white'}`}>
                  ✎
                </button>

                {/* Remove Icon */}
                <button onClick={() => removePhoto(photo.id)} className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors z-10 ${isDark ? 'bg-red-900/80 hover:bg-red-800 text-red-300' : 'bg-red-500/80 hover:bg-red-600 text-white'}`}>
                  ✕
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingPhoto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-lg rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh] ${isDark ? 'bg-slate-800 border border-purple-500/30' : 'bg-white'}`}
            >
              <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-pink-300' : 'text-rose-700'}`}>Edit Photo</h2>

              <div className="space-y-4">
                {/* Src Toggle */}
                <div className="flex gap-2">
                  <button onClick={() => setEditSrcType('url')} className={`flex-1 py-1 rounded text-sm ${editSrcType === 'url' ? (isDark ? 'bg-blue-500 text-white' : 'bg-blue-500 text-white') : 'bg-gray-200 text-gray-500'}`}>URL</button>
                  <button onClick={() => setEditSrcType('upload')} className={`flex-1 py-1 rounded text-sm ${editSrcType === 'upload' ? (isDark ? 'bg-blue-500 text-white' : 'bg-blue-500 text-white') : 'bg-gray-200 text-gray-500'}`}>File</button>
                </div>

                {editSrcType === 'url' ? (
                  <input type="url" value={editImageUrl} onChange={(e) => { setEditImageUrl(e.target.value); setEditFile(null); }} className={`w-full p-2 rounded border ${isDark ? 'bg-slate-900 text-white border-slate-700' : ''}`} />
                ) : (
                  <input type="file" onChange={handleEditFileUpload} className={`w-full p-2 rounded border ${isDark ? 'bg-slate-900 text-white border-slate-700' : ''}`} />
                )}

                {editImageUrl && (
                  <div className="h-32 w-full rounded overflow-hidden bg-gray-100">
                    <img src={editImageUrl} className="w-full h-full object-cover" />
                  </div>
                )}

                <div>
                  <label className="text-xs uppercase font-bold text-gray-500 block mb-1">Caption</label>
                  <input type="text" value={editCaption} onChange={(e) => setEditCaption(e.target.value)} className={`w-full p-2 rounded border ${isDark ? 'bg-slate-900 text-white border-slate-700' : ''}`} />
                </div>

                <div>
                  <label className="text-xs uppercase font-bold text-gray-500 block mb-1">Date</label>
                  <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className={`w-full p-2 rounded border ${isDark ? 'bg-slate-900 text-white border-slate-700' : ''}`} />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setEditingPhoto(null)} className="flex-1 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800">Cancel</button>
                <button onClick={handleUpdate} disabled={isUploading} className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium">
                  {isUploading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  );
}
