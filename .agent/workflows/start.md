---
description: Start the compliments app development server (restarts if running)
---
# Start Compliments App (Restart)

// turbo-all

1. Kill any existing server running on port 3000 (if any):
```bash
lsof -t -i:3000 | xargs kill -9 || true
```

2. Start the development server:
```bash
cd /Users/tirthesh.patil/Library/CloudStorage/OneDrive-RelianceCorporateITParkLimited/Documents/Compliments/compliments-app && npm run dev
```

3. Open the browser:
   Open http://localhost:3000

4. The app will be available at **http://localhost:3000**
