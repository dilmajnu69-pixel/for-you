export const APP_CONFIG = {
  // Default Spotify Playlist
  DEFAULT_PLAYLIST_ID: '73p3IURsPbToonbfMWZXwA',

  // Navigation Links for the Home Page
  FEATURES: [
    {
      title: 'Messages',
      description: 'Sweet words and special notes just for you',
      emoji: '💌',
      href: '/messages',
    },
    {
      title: 'Special Dates',
      description: 'Countdown to our precious moments together',
      emoji: '🗓️',
      href: '/special-dates',
    },
    {
      title: 'Gallery',
      description: 'Our favorite memories captured in photos',
      emoji: '📸',
      href: '/gallery',
    },
    {
      title: 'Our Songs',
      description: 'Music that reminds us of each other',
      emoji: '🎵',
      href: '/music',
    },
  ],

  // Animation Constants
  ANIMATION: {
    PAGE_TRANSITION: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] as const, // Custom cubic bezier
    }
  }
};
