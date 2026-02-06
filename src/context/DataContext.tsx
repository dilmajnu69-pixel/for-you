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
  caption?: string;
  date?: string;
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
  addPhoto: (fileOrUrl: File | string, caption?: string, date?: string) => Promise<{ success: boolean; error?: string }>;
  updatePhoto: (id: number, fileOrUrl: File | string | null, caption?: string, date?: string) => Promise<{ success: boolean; error?: string }>;
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
        const [msgRes, dateRes, musicRes] = await Promise.all([
          fetch('/api/save-data?type=messages'),
          fetch('/api/save-data?type=special-dates'),
          fetch('/api/save-data?type=music')
        ]);

        if (msgRes.ok) {
          const data = await msgRes.json();
          if (Array.isArray(data)) setMessages(data);
          else setMessages(initialMessages.messages);
        } else {
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

  // CRUD Operations

  const addMessage = (text: string, type: string = 'note') => {
    const newId = Math.max(0, ...messages.map(m => m.id)) + 1;
    const newMessages = [...messages, { id: newId, text, type }];
    setMessages(newMessages);
    fetch('/api/save-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'messages', data: newMessages }),
    }).catch(err => console.error('Failed to save messages:', err));
  };

  const removeMessage = (id: number) => {
    const newMessages = messages.filter(m => m.id !== id);
    setMessages(newMessages);
    fetch('/api/save-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'messages', data: newMessages }),
    }).catch(err => console.error('Failed to save messages:', err));
  };

  const addSpecialDate = (title: string, date: string, emoji: string, recurring: boolean) => {
    const newId = Math.max(0, ...specialDates.map(s => s.id)) + 1;
    const newDates = [...specialDates, { id: newId, title, date, emoji, recurring }];
    setSpecialDates(newDates);
    fetch('/api/save-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'special-dates', data: newDates }),
    }).catch(err => console.error('Failed to save special dates:', err));
  };

  const removeSpecialDate = (id: number) => {
    const newDates = specialDates.filter(s => s.id !== id);
    setSpecialDates(newDates);
    fetch('/api/save-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'special-dates', data: newDates }),
    }).catch(err => console.error('Failed to save special dates:', err));
  };

  const addPhoto = async (fileOrUrl: File | string, caption?: string, date?: string) => {
    try {
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
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
    }
  };

  const updatePhoto = async (id: number, fileOrUrl: File | string | null, caption?: string, date?: string) => {
    try {
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
    const newSongs = [...songs, { id: newId, title, artist, spotifyId }];
    setSongs(newSongs);
    fetch('/api/save-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'music', data: newSongs }),
    }).catch(err => console.error('Failed to save music:', err));
  };

  const removeSong = (id: number) => {
    const newSongs = songs.filter(s => s.id !== id);
    setSongs(newSongs);
    fetch('/api/save-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'music', data: newSongs }),
    }).catch(err => console.error('Failed to save music:', err));
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
