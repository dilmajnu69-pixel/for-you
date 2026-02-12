# 💝 Compliments App

A personalized, romantic web application built to celebrate special moments and memories. Designed with love, featuring immersive animations and a premium user experience.

![App Preview](public/preview.png) *(Note: Add a preview image if available)*

## ✨ Features

- **Personalized Greeting**: Dynamic "Hello, [Name]" message on the home page.
- **Global Music Visualizer**:
    - Toggle with the **Heart Emoji (💕)** on the Home page (Turns into a **Red Balloon 🎈** when active).
    - Particles persist across the entire site for a seamless experience.
- **Premium Animations**:
    - Smooth "Fade & Scale" page transitions.
    - Interactive cursor trail (sparkles/hearts) and click bursts.
    - Animated background gradients.
- **Dedicated Sections**:
    - **💌 Messages**: For sweet notes and letters.
    - **🗓️ Special Dates**: Countdown to anniversaries.
    - **📸 Gallery**: Photo memories.
    - **🎵 Our Songs**: Spotify integration with custom playlists.
- **Theme Support**: Dark/Light mode toggle with persistent preference.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Language**: TypeScript

## 🚀 Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## ⚙️ Configuration

The application is designed to be easily customizable via the central configuration file:

**File**: `src/config/constants.ts`

```typescript
export const APP_CONFIG = {
  // Change the default Spotify playlist here
  DEFAULT_PLAYLIST_ID: '73p3IURsPbToonbfMWZXwA',
  
  // Customize Home Page Menu Links
  FEATURES: [
    { title: 'Messages', emoji: '💌', href: '/messages', ... },
    // ...
  ],

  // Tweak Animation Timings
  ANIMATION: { ... }
};
```

## 📂 Project Structure

- `src/app`: Application routes and pages.
- `src/components`: Reusable UI components (Visualizer, Transitions, etc.).
- `src/context`: React Context providers (Theme, Global State).
- `src/config`: Centralized constants.
- `src/data`: JSON data files for content (pet names, etc.).

## 🎨 Customization Tips

- **Pet Names**: Edit `src/data/pet-names.json` to add your own nicknames.
- **Visualizer**: Logic resides in `src/components/MusicVisualizer.tsx`.
- **Cursor Effects**: Modify emojis in `src/components/CursorEffects.tsx`.

## � Deployment

The easiest way to deploy this Next.js app is using **Vercel** (the creators of Next.js).

### Option 1: Vercel (Recommended)
1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket).
2. Go to [Vercel](https://vercel.com) and sign up/login.
3. Click "Add New Project" and import your repository.
4. Vercel will detect `Next.js` automatically.
5. Click **Deploy**. Use the provided domain (e.g., `compliments-app.vercel.app`) to share it!

### Option 2: Netlify
1. Push your code to Git.
2. Go to [Netlify](https://netlify.com) and "New Site from Git".
3. Build Command: `npm run build`
4. Publish Directory: `.next` (Netlify usually handles Next.js automatically via a plugin).

### Option 3: Manual / VPS
1. Build the app: `npm run build`
2. Start the server: `npm start`
3. Use a process manager like `pm2` and a reverse proxy like Nginx.


## 📄 License & Legal Warning

**© 2024-2025 Compliments App. All Rights Reserved.**

This project assumes a **STRICT PROPRIETARY LICENSE**.

- **Unauthorized Copying**: Copying, modifying, distributing, or using this codebase, in whole or in part, for any commercial or non-commercial purpose without explicit written permission from the owner is **STRICTLY PROHIBITED**.
- **Plagiarism**: Any attempt to replicate, clone, or present this work as your own will be met with legal action to the fullest extent of applicable intellectual property laws.
- **Accountability**: By accessing this repository, you acknowledge that you have read this warning. Violators will be held accountable for plagiarism and copyright infringement.

This software is provided for personal viewing only by the intended recipient.
