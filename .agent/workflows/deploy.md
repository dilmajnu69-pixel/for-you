---
description: Deploy the changes to production by pushing to the main branch
---

// turbo-all
# Deploy to Production

Follow these steps to deploy all current changes to the production site on Vercel.

1.  **Add all changes**
    ```bash
    git add .
    ```

2.  **Commit changes**
    *Use a descriptive message or the default one provided.*
    ```bash
    git commit -m "Deploy: Updated application to production"
    ```

3.  **Push to main**
    *This triggers the automatic Vercel deployment pipeline.*
    ```bash
    git push origin main
    ```

4.  **Verify Deployment**
    Check the [Vercel Dashboard](https://vercel.com/dashboard) or the production URL:
    [https://for-you-red.vercel.app](https://for-you-red.vercel.app)
