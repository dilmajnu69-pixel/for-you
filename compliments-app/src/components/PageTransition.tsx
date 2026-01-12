'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { APP_CONFIG } from '@/config/constants';

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * Page Transition Wrapper.
 * 
 * Wraps page content to provide a smooth "Fade & Scale" animation when navigating between routes.
 * Uses `AnimatePresence` with `mode="wait"` to ensure the exit animation completes before the new page enters.
 */
export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={APP_CONFIG.ANIMATION.PAGE_TRANSITION}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
