---
description: Deploy the application to Vercel
---

# Deploy to Vercel

This workflow guides you through deploying your Next.js application to Vercel using the command line.

## Prerequisites

- You need a Vercel account (Sign up at [vercel.com](https://vercel.com)).

## Steps

1.  **Login to Vercel CLI**
    If you haven't logged in on this machine before, run this command and follow the prompts (email/github login).
    ```bash
    npx vercel login
    ```

2.  **Deploy Preview**
    Run the deploy command.
    - Set up and deploy: **Y**
    - Which scope: **(Select your account)**
    - Link to existing project: **N** (or Y if you already made one)
    - Project name: **(Press Enter for default)**
    - In which directory: **./** (Press Enter)
    - Want to modify settings: **N** (Next.js defaults are good)
    
    ```bash
    npx vercel
    ```
    *This creates a "Preview" URL.*

3.  **Deploy to Production**
    Once you are happy with the preview, deploy to your live production URL.
    ```bash
    npx vercel --prod
    ```

## Alternative: Git Deployment (Recommended for Long Term)
1. Push your code to GitHub.
2. Import the repository on the Vercel Dashboard.
3. Every push to `main` will automatically deploy!
