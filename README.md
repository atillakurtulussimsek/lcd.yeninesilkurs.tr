# LCD Signage Player

A production-ready digital signage web application for displaying media content on TVs inside educational institutions.

## Architecture

- **Framework:** Next.js 16 (App Router) with TypeScript
- **Deployment:** Docker container via Coolify
- **CDN:** Cloudflare R2 bucket at `https://lcd-cdn.yeninesilkurs.tr`
- **Caching:** Service Worker with offline support

## How It Works

1. The TV opens `https://lcd.yeninesilkurs.tr`
2. The app fetches `playlist.json` from the CDN
3. Media files (videos/images) play sequentially in fullscreen
4. When the playlist ends, it reloads `playlist.json` and loops
5. CDN changes are picked up on every loop restart

## Playlist Format

Upload `playlist.json` to your R2 bucket root:

```json
{
  "playlist": [
    {
      "type": "video",
      "src": "media/video1.mp4"
    },
    {
      "type": "image",
      "src": "media/kampanya.jpg",
      "duration": 15
    },
    {
      "type": "video",
      "src": "media/tanitim.mp4"
    }
  ]
}
```

### Rules
- `type`: `"video"` or `"image"` (auto-detected if omitted)
- `src`: Path relative to CDN root
- `duration`: Display time for images in seconds (default: 15)
- Videos always play for their full duration

### Supported Formats
- **Video:** mp4, webm, mov
- **Image:** jpg, jpeg, png, webp, gif

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Docker Build

```bash
docker build -t lcd-signage .
docker run -p 3000:3000 lcd-signage
```

## Coolify Deployment

### Prerequisites
- A Coolify instance connected to your server
- A Git repository with this code

### Steps

1. **Create New Resource** in Coolify
   - Select "Application" → connect your Git repository

2. **Build Configuration**
   - Build Pack: **Dockerfile**
   - Dockerfile Location: `Dockerfile`

3. **Environment Variables**
   - No environment variables required

4. **Network**
   - Port: `3000`

5. **Domain**
   - Set domain to `lcd.yeninesilkurs.tr`
   - Enable HTTPS

6. **Deploy**
   - Click Deploy and wait for the build to complete

### CDN Setup (Cloudflare R2)

1. Create an R2 bucket
2. Add a custom domain: `lcd-cdn.yeninesilkurs.tr`
3. Upload your media files to the bucket (e.g., `media/video1.mp4`)
4. Upload `playlist.json` to the bucket root
5. Ensure public access is enabled on the bucket

### CORS Configuration

Add a CORS rule to your R2 bucket to allow the signage domain:

```json
[
  {
    "AllowedOrigins": ["https://lcd.yeninesilkurs.tr"],
    "AllowedMethods": ["GET"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 86400
  }
]
```

## Features

- ✅ Continuous fullscreen playback loop
- ✅ Automatic playlist refresh on each loop
- ✅ Video autoplay with sound (muted fallback for restricted browsers)
- ✅ Service Worker caching for offline resilience
- ✅ Media preloading for smooth transitions
- ✅ Error recovery (skips broken files)
- ✅ Wake Lock API to prevent sleep
- ✅ TV-optimized (hidden cursor, no scrollbars, black background)
- ✅ PWA manifest for fullscreen display mode
- ✅ Compatible with Samsung Tizen, LG WebOS, Android TV, Chrome

## Project Structure

```
app/
  components/
    SignagePlayer.tsx   # Main orchestrator component
    VideoPlayer.tsx     # Video playback with autoplay fallback
    ImagePlayer.tsx     # Timed image display
  hooks/
    usePlayer.ts        # Core playback loop engine
    useWakeLock.ts      # Screen Wake Lock API
    useTVMode.ts        # Fullscreen & cursor hiding
  services/
    types.ts            # Types and constants
    playlist.ts         # Playlist fetcher
    preloader.ts        # Media preloading
  layout.tsx            # Root layout with meta tags
  page.tsx              # Entry point
  globals.css           # TV-optimized global styles
public/
  sw.js                 # Service Worker
  manifest.json         # PWA manifest
Dockerfile              # Multi-stage Docker build
```
