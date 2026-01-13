'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types for application data structures
interface Message {
  id: number;
  text: string;
  type: string; // 'love', 'note', 'memory' etc.
}

interface SpecialDate {
  id: number;
  title: string;
  date: string; // ISO format YYYY-MM-DD
  emoji: string;
  recurring: boolean; // If true, repeats every year
}

interface Photo {
  id: number;
  src: string; // URL or path to image
  caption: string;
  date: string;
  storagePath?: string; // Optional: path in Firebase Storage
}

interface Song {
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
  loadingConfig: {
    photos: boolean;
  };
  addMessage: (text: string, type: string) => void;
  removeMessage: (id: number) => void;
  addSpecialDate: (title: string, date: string, emoji: string, recurring: boolean) => void;
  removeSpecialDate: (id: number) => void;
  addPhoto: (fileOrUrl: File | string, caption: string, date: string) => Promise<{ success: boolean; error?: string }>;
  updatePhoto: (id: number, fileOrUrl: File | string | null, caption: string, date: string) => Promise<{ success: boolean; error?: string }>;
  removePhoto: (id: number) => Promise<void>;
  addSong: (title: string, artist: string, spotifyId: string) => void;
  removeSong: (id: number) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Import initial JSON data to populate state if localStorage is empty
import initialMessages from '@/../data/messages.json';
import initialSpecialDates from '@/../data/special-dates.json';
import initialMusic from '@/../data/music.json';

// Provider Component: Manages global state and data persistence
export function DataProvider({ children }: { children: ReactNode }) {
  // State initialization
  const [messages, setMessages] = useState<Message[]>([]);
  const [specialDates, setSpecialDates] = useState<SpecialDate[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState({ photos: true });

  // Initial Data Load
  useEffect(() => {
    // 1. Load LocalStorage items (legacy/local-only data)
    const storedMessages = localStorage.getItem('messages');
    const storedSpecialDates = localStorage.getItem('specialDates');
    const storedSongs = localStorage.getItem('songs');

    // eslint-disable-next-line
    setMessages(storedMessages ? JSON.parse(storedMessages) : initialMessages.messages);
    setSpecialDates(storedSpecialDates ? JSON.parse(storedSpecialDates) : initialSpecialDates.specialDates);
    setSongs(storedSongs ? JSON.parse(storedSongs) : initialMusic.songs);

    // 2. Load Photos from API (Persistent DB)
    fetch('/api/photos')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPhotos(data);
        }
      })
      .catch(err => console.error("Failed to load photos", err))
      .finally(() => setLoadingConfig(prev => ({ ...prev, photos: false })));

    setIsLoaded(true);
  }, []);

  // Effects: Persist NON-PHOTO state changes to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('messages', JSON.stringify(messages));
    }
  }, [messages, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('specialDates', JSON.stringify(specialDates));
    }
  }, [specialDates, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('songs', JSON.stringify(songs));
    }
  }, [songs, isLoaded]);

  // CRUD Operations

  const addMessage = (text: string, type: string = 'note') => {
    const newId = Math.max(0, ...messages.map(m => m.id)) + 1;
    setMessages([...messages, { id: newId, text, type }]);
  };

  const removeMessage = (id: number) => {
    setMessages(messages.filter(m => m.id !== id));
  };

  const addSpecialDate = (title: string, date: string, emoji: string, recurring: boolean) => {
    const newId = Math.max(0, ...specialDates.map(s => s.id)) + 1;
    setSpecialDates([...specialDates, { id: newId, title, date, emoji, recurring }]);
  };

  const removeSpecialDate = (id: number) => {
    setSpecialDates(specialDates.filter(s => s.id !== id));
  };

  const addPhoto = async (fileOrUrl: File | string, caption: string, date: string) => {
    try {
      const formData = new FormData();
      if (typeof fileOrUrl === 'string') {
        formData.append('src', fileOrUrl);
      } else {
        formData.append('file', fileOrUrl);
      }
      formData.append('caption', caption);
      formData.append('date', date);

      const res = await fetch('/api/photos', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'API save failed');
      }

      setPhotos(prev => [data, ...prev]);
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
    }
  };

  const updatePhoto = async (id: number, fileOrUrl: File | string | null, caption: string, date: string) => {
    try {
      const formData = new FormData();
      if (fileOrUrl) {
        if (typeof fileOrUrl === 'string') {
          formData.append('src', fileOrUrl);
        } else {
          formData.append('file', fileOrUrl);
        }
      }
      formData.append('caption', caption);
      formData.append('date', date);

      const res = await fetch(`/api/photos/${id}`, {
        method: 'PUT',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Update failed');
      }

      setPhotos(prev => prev.map(p => p.id === id ? data : p));
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
    }
  };

  const removePhoto = async (id: number) => {
    // Optimistic update
    const previousPhotos = [...photos];
    setPhotos(photos.filter(p => p.id !== id));

    try {
      const res = await fetch(`/api/photos/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
    } catch (e) {
      console.error(e);
      // Revert if failed
      setPhotos(previousPhotos);
    }
  };

  const addSong = (title: string, artist: string, spotifyId: string) => {
    const newId = Math.max(0, ...songs.map(s => s.id)) + 1;
    setSongs([...songs, { id: newId, title, artist, spotifyId }]);
  };

  const removeSong = (id: number) => {
    setSongs(songs.filter(s => s.id !== id));
  };

  return (
    <DataContext.Provider value={{
      messages,
      specialDates,
      photos,
      songs,
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
