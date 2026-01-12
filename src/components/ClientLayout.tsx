'use client';

import { ThemeProvider } from '@/context/ThemeContext';
import { DataProvider } from '@/context/DataContext';
import ThemeToggle from '@/components/ThemeToggle';
import CursorEffects from '@/components/CursorEffects';
import MusicVisualizer from '@/components/MusicVisualizer';
import AnimatedBackground from '@/components/AnimatedBackground';
import { ReactNode } from 'react';

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <ThemeProvider>
      <DataProvider>
        <ThemeToggle />
        <CursorEffects />
        <MusicVisualizer />
        <AnimatedBackground enableInteractivity />
        {children}
      </DataProvider>
    </ThemeProvider>
  );
}

