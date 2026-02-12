'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types for application data structures
export interface Message {
  id: number;
  text: string;
  type: string; // 'love', 'note', 'memory' etc.
}

export interface SpecialDate {
  id: number;
  title: string;
  date: string; // ISO format YYYY-MM-DD
  emoji: string;
  recurring: boolean; // If true, repeats every year
}

export interface Photo {
  id: number;
  src: string; // URL or path to image
  caption?: string;
  date?: string;
  storagePath?: string; // Optional: path in Firebase Storage
}

export interface Song {
  id: number;
  title: string;
  artist: string;
  spotifyId: string; // Extracted from Spotify share URL
}

// Context Interface Definition
interface DataContextType {
  messages: Message[];
  specialDates: SpecialDate[];
  photos: Photo[];
  songs: Song[];
  petNames: string[];
  loveLetter: {
    title: string;
    paragraphs: string[];
    signature: string;
  };
  loadingConfig: {
    photos: boolean;
  };
  addMessage: (text: string, type: string) => Promise<Response>;
  removeMessage: (id: number) => Promise<Response>;
  addSpecialDate: (title: string, date: string, emoji: string, recurring: boolean) => Promise<Response>;
  removeSpecialDate: (id: number) => Promise<Response>;
  addPhoto: (fileOrUrl: File | string, caption?: string, date?: string) => Promise<{ success: boolean; data?: Photo; error?: string }>;
  updatePhoto: (id: number, fileOrUrl: File | string | null, caption?: string, date?: string) => Promise<{ success: boolean; data?: Photo; error?: string }>;
  removePhoto: (id: number) => Promise<Response>;
  addSong: (title: string, artist: string, spotifyId: string) => Promise<Response>;
  removeSong: (id: number) => Promise<Response>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Import initial JSON data to populate state if localStorage is empty
import initialMessages from '@/../data/messages.json';
import initialSpecialDates from '@/../data/special-dates.json';
import initialMusic from '@/../data/music.json';
import initialPetNames from '@/../data/pet-names.json';
import initialLoveLetter from '@/../data/love-letter.json';

import { toast } from 'react-hot-toast';

// Provider Component: Manages global state and data persistence
export function DataProvider({ children }: { children: ReactNode }) {
  // State initialization
  const [messages, setMessages] = useState<Message[]>([]);
  const [specialDates, setSpecialDates] = useState<SpecialDate[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [petNames, setPetNames] = useState<string[]>(initialPetNames.petNames);
  const [loveLetter, setLoveLetter] = useState(initialLoveLetter);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState({ photos: true });

  // Initial Data Load
  useEffect(() => {
    // 1. Load Photos from API (Persistent DB)
    const loadPhotos = fetch('/api/photos')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setPhotos(data);
      })
      .catch(err => console.error("Failed to load photos", err));

    // 2. Load JSON Data from API (Persistent Files)
    const loadJsonData = async () => {
      try {
        const [msgRes, dateRes, musicRes, namesRes, letterRes] = await Promise.all([
          fetch('/api/save-data?type=messages'),
          fetch('/api/save-data?type=special-dates'),
          fetch('/api/save-data?type=music'),
          fetch('/api/save-data?type=pet-names'),
          fetch('/api/save-data?type=love-letter')
        ]);

        if (msgRes.ok) {
          const data = await msgRes.json();
          // Use the data if it exists, even if empty. Only fallback if data is null/undefined.
          if (Array.isArray(data)) setMessages(data);
          else setMessages(initialMessages.messages);
        } else {
          // Fetch failed (status 404/500), use bundled defaults
          setMessages(initialMessages.messages);
        }

        if (dateRes.ok) {
          const data = await dateRes.json();
          if (Array.isArray(data)) setSpecialDates(data);
          else setSpecialDates(initialSpecialDates.specialDates);
        } else {
          setSpecialDates(initialSpecialDates.specialDates);
        }

        if (musicRes.ok) {
          const data = await musicRes.json();
          if (Array.isArray(data)) setSongs(data);
          else setSongs(initialMusic.songs);
        } else {
          setSongs(initialMusic.songs);
        }

        if (namesRes.ok) {
          const data = await namesRes.json();
          if (Array.isArray(data) && data.length > 0) setPetNames(data);
        }

        if (letterRes.ok) {
          const data = await letterRes.json();
          if (data && data.title) setLoveLetter(data);
        }

      } catch (error) {
        console.error("Failed to load JSON data", error);
        // Fallback to initial local data
        setMessages(initialMessages.messages);
        setSpecialDates(initialSpecialDates.specialDates);
        setSongs(initialMusic.songs);
      }
    };

    Promise.all([loadPhotos, loadJsonData()])
      .finally(() => {
        setLoadingConfig(prev => ({ ...prev, photos: false }));
        setIsLoaded(true);
      });
  }, []);



  // CRUD Operations

  const addMessage = (text: string, type: string = 'note') => {
    const newId = Math.max(0, ...messages.map(m => m.id)) + 1;
    const newMessages = [...messages, { id: newId, text, type }];

    setMessages(newMessages);

    const promise = fetch('/api/save-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'messages', data: newMessages }),
    }).then(res => {
      if (!res.ok) throw new Error('Failed to save');
      return res;
    });

    toast.promise(promise, {
      loading: 'Writing your note... ✍️',
      success: 'Message saved! 💌',
      error: 'Could not save message 😢',
    });

    return promise;
  };

  const removeMessage = (id: number) => {
    const newMessages = messages.filter(m => m.id !== id);
    setMessages(newMessages);

    const promise = fetch('/api/save-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'messages', data: newMessages }),
    }).then(res => {
      if (!res.ok) throw new Error('Failed to delete');
      return res;
    });

    toast.promise(promise, {
      loading: 'Removing message... 🗑️',
      success: 'Message removed! ✨',
      error: 'Failed to delete message ❌',
    });

    return promise;
  };

  const addSpecialDate = (title: string, date: string, emoji: string, recurring: boolean) => {
    const newId = Math.max(0, ...specialDates.map(s => s.id)) + 1;
    const newDates = [...specialDates, { id: newId, title, date, emoji, recurring }];
    setSpecialDates(newDates);

    const promise = fetch('/api/save-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'special-dates', data: newDates }),
    }).then(res => {
      if (!res.ok) throw new Error('Failed to save');
      return res;
    });

    toast.promise(promise, {
      loading: 'Marking the calendar... 📅',
      success: 'Special date added! 🎉',
      error: 'Could not save date 😢',
    });

    return promise;
  };

  const removeSpecialDate = (id: number) => {
    const newDates = specialDates.filter(s => s.id !== id);
    setSpecialDates(newDates);

    const promise = fetch('/api/save-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'special-dates', data: newDates }),
    }).then(res => {
      if (!res.ok) throw new Error('Failed to remove');
      return res;
    });

    toast.promise(promise, {
      loading: 'Deleting memory... 🗑️',
      success: 'Date removed! ✨',
      error: 'Failed to remove date ❌',
    });

    return promise;
  };

  const addPhoto = async (fileOrUrl: File | string, caption?: string, date?: string) => {
    const uploadPromise = (async () => {
      const formData = new FormData();
      if (typeof fileOrUrl === 'string') {
        formData.append('src', fileOrUrl);
      } else {
        formData.append('file', fileOrUrl);
      }
      if (caption) formData.append('caption', caption);
      if (date) formData.append('date', date);

      const res = await fetch('/api/photos', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'API save failed');
      }

      setPhotos(prev => [data, ...prev]);
      return data;
    })();

    toast.promise(uploadPromise, {
      loading: 'Uploading your memory... 📸',
      success: 'Photo added to gallery! ❤️',
      error: (err) => `Upload failed: ${err.message || 'Error'} 😢`,
    });

    try {
      const data = await uploadPromise;
      return { success: true, data };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
    }
  };

  const updatePhoto = async (id: number, fileOrUrl: File | string | null, caption?: string, date?: string) => {
    const updatePromise = (async () => {
      const formData = new FormData();
      if (fileOrUrl) {
        if (typeof fileOrUrl === 'string') {
          formData.append('src', fileOrUrl);
        } else {
          formData.append('file', fileOrUrl);
        }
      }
      if (caption !== undefined) formData.append('caption', caption);
      if (date !== undefined) formData.append('date', date);

      const res = await fetch(`/api/photos/${id}`, {
        method: 'PUT',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Update failed');
      }

      setPhotos(prev => prev.map(p => p.id === id ? data : p));
      return data;
    })();

    toast.promise(updatePromise, {
      loading: 'Updating photo details... ✏️',
      success: 'Memory updated! ✨',
      error: 'Failed to update photo 😢',
    });

    try {
      const data = await updatePromise;
      return { success: true, data };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
    }
  };

  const removePhoto = async (id: number) => {
    const previousPhotos = [...photos];
    setPhotos(photos.filter(p => p.id !== id));

    const promise = fetch(`/api/photos/${id}`, { method: 'DELETE' }).then(res => {
      if (!res.ok) throw new Error('Delete failed');
      return res;
    });

    toast.promise(promise, {
      loading: 'Deleting photo from Drive... 🗑️',
      success: 'Photo removed! ✅',
      error: () => {
        setPhotos(previousPhotos);
        return 'Failed to remove photo 😢';
      },
    });

    return promise;
  };

  const addSong = (title: string, artist: string, spotifyId: string) => {
    const newId = Math.max(0, ...songs.map(s => s.id)) + 1;
    const newSongs = [...songs, { id: newId, title, artist, spotifyId }];
    setSongs(newSongs);

    const promise = fetch('/api/save-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'music', data: newSongs }),
    }).then(res => {
      if (!res.ok) throw new Error('Failed to save');
      return res;
    });

    toast.promise(promise, {
      loading: 'Adding to playlist... 🎵',
      success: 'Song added! 🎶',
      error: 'Could not save song 😢',
    });

    return promise;
  };

  const removeSong = (id: number) => {
    const newSongs = songs.filter(s => s.id !== id);
    setSongs(newSongs);

    const promise = fetch('/api/save-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'music', data: newSongs }),
    }).then(res => {
      if (!res.ok) throw new Error('Failed to remove');
      return res;
    });

    toast.promise(promise, {
      loading: 'Removing song... 🗑️',
      success: 'Song removed! ✨',
      error: 'Failed to remove song ❌',
    });

    return promise;
  };

  return (
    <DataContext.Provider value={{
      messages,
      specialDates,
      photos,
      songs,
      petNames,
      loveLetter,
      loadingConfig,
      addMessage,
      removeMessage,
      addSpecialDate,
      removeSpecialDate,
      addPhoto,
      updatePhoto,
      removePhoto,
      addSong,
      removeSong,
    }}>
      {children}
    </DataContext.Provider>
  );
}

// Custom Hook for consuming DataContext
export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
