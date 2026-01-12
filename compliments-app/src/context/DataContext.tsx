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
  addMessage: (text: string, type: string) => void;
  removeMessage: (id: number) => void;
  addSpecialDate: (title: string, date: string, emoji: string, recurring: boolean) => void;
  removeSpecialDate: (id: number) => void;
  addPhoto: (src: string, caption: string, date: string) => void;
  removePhoto: (id: number) => void;
  addSong: (title: string, artist: string, spotifyId: string) => void;
  removeSong: (id: number) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Import initial JSON data to populate state if localStorage is empty
import initialMessages from '@/../data/messages.json';
import initialSpecialDates from '@/../data/special-dates.json';
import initialPhotos from '@/../data/photos.json';
import initialMusic from '@/../data/music.json';

// Provider Component: Manages global state and data persistence
export function DataProvider({ children }: { children: ReactNode }) {
  // State initialization
  const [messages, setMessages] = useState<Message[]>([]);
  const [specialDates, setSpecialDates] = useState<SpecialDate[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Effect: Load data from localStorage on component mount
  // Fallback to initial JSON files if no local data exists
  useEffect(() => {
    const storedMessages = localStorage.getItem('messages');
    const storedSpecialDates = localStorage.getItem('specialDates');
    const storedPhotos = localStorage.getItem('photos');
    const storedSongs = localStorage.getItem('songs');

    // eslint-disable-next-line
    setMessages(storedMessages ? JSON.parse(storedMessages) : initialMessages.messages);
    setSpecialDates(storedSpecialDates ? JSON.parse(storedSpecialDates) : initialSpecialDates.specialDates);
    setPhotos(storedPhotos ? JSON.parse(storedPhotos) : initialPhotos.photos);
    setSongs(storedSongs ? JSON.parse(storedSongs) : initialMusic.songs);
    setIsLoaded(true);
  }, []);

  // Effects: Persist state changes to localStorage
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
      localStorage.setItem('photos', JSON.stringify(photos));
    }
  }, [photos, isLoaded]);

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

  const addPhoto = (src: string, caption: string, date: string) => {
    const newId = Math.max(0, ...photos.map(p => p.id)) + 1;
    setPhotos([...photos, { id: newId, src, caption, date }]);
  };

  const removePhoto = (id: number) => {
    setPhotos(photos.filter(p => p.id !== id));
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
      addMessage,
      removeMessage,
      addSpecialDate,
      removeSpecialDate,
      addPhoto,
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
