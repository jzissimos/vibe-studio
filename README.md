# Vibe Studio - AI Cinematographer

A Next.js web application for AI-powered image and video generation using FAL AI models.

## 🚀 Current Status: Fully Functional ✅

**Baseline working version:** `git checkout baseline-working`

- ✅ FLUX image generation (~1-2 sec)
- ✅ Kling video generation (5 sec)
- ✅ Vercel production deployment
- ✅ Comprehensive documentation
- ✅ Browser-based testing (curl shows false auth errors)

## Features

- 🎨 **Multi-modal Generation**: Create both images (FLUX) and videos (Kling)
- ⚡ **Fast Generation**: Images in ~1-2 seconds, videos in ~5 seconds
- 🎯 **Professional UI**: Clean, responsive interface with model selection
- 🚀 **Production Ready**: Deployed on Vercel with automatic scaling
- 🔧 **Official FAL Integration**: Uses FAL's official client library

## Models Supported

- **FLUX.1 [dev]**: High-quality image generation
- **Kling 2.5 Turbo Pro (T2V)**: Cinematic video generation with advanced controls:
  - Duration: 5 or 10 seconds
  - Aspect ratios: 16:9, 9:16, 1:1
  - Negative prompts
  - CFG scale adjustment
- **Kling 2.5 Turbo Pro (I2V)**: Bring images to life with motion:
  - Input: Image URL (JPG, PNG, WebP, etc.) or drag-and-drop file upload
  - Duration: 5 or 10 seconds
  - Negative prompts for quality control
  - Add cinematic motion to existing images
- **MiniMax Hailuo-02 Pro (I2V)**: Advanced 1080p image-to-video generation:
  - Input: Image URL with drag-and-drop upload (up to 20MB)
  - Prompt optimizer for enhanced results
  - Optional end image for custom transitions
  - High-quality 1080p video output
- **Sync Lip Sync v2 Pro (V2V)**: Professional lip synchronization:
  - Input: Video + Audio files with drag-and-drop upload
  - Sync modes: Cut off, loop, bounce, silence, or remap
  - Realistic lip movements with natural facial features
  - Preserve unique details like teeth and expressions

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **AI**: FAL AI (fal.ai)
- **Deployment**: Vercel

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-cinematographer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your FAL_KEY
   ```

4. **Run locally**
   ```bash
   npm run dev
   ```

5. **Open** `http://localhost:3000/studio`

## Environment Variables

```bash
FAL_KEY=your_fal_api_key_here
```

Get your API key from [fal.ai/dashboard/keys](https://fal.ai/dashboard/keys)

## Deployment

### Vercel (Recommended)

1. **Connect GitHub** to Vercel
2. **Import project** from `jzissimos/vibe-studio`
3. **Add environment variable**:
   - Name: `FAL_KEY`
   - Value: Your full FAL API key
   - Environment: Production
4. **Deploy**

### Manual Testing Quirk ⚠️

**Important for Developers/Contributors:**

Direct API testing with curl/tools may show "Authentication Required" errors from Vercel, but the application works perfectly in browsers.

**Why this happens:**
- Vercel has request filtering that blocks direct API calls
- Browser requests work normally with proper environment variables
- This is not a bug - it's Vercel protecting API routes

**How to properly test:**
1. ✅ **Browser testing**: Visit the deployed URL and use the interface
2. ✅ **Check Vercel logs**: Monitor deployment and runtime logs
3. ❌ **Avoid curl testing**: May show false authentication errors

**Example working test:**
```bash
# This may show auth errors (false negative):
curl -X POST "https://your-app.vercel.app/api/generate" -d '{"modelId":"fal-ai/flux/dev","prompt":"test"}'

# But the app works perfectly in browsers!
open https://your-app.vercel.app/studio
```

## Usage

1. **Select Model**: Choose FLUX (images) or Kling (videos)
2. **Enter Prompt**: Describe what you want to generate
3. **Click Generate**: Wait 1-3 seconds
4. **View Result**: Images/videos display automatically

## API

### Generate Media

```bash
POST /api/generate
Content-Type: application/json

{
  "modelId": "fal-ai/flux/dev", // or "fal-ai/kling-video/v2.5-turbo/pro/text-to-video"
  "prompt": "beautiful sunset over mountains",
  "params": {} // optional model-specific parameters
}
```

**Response:**
```json
{
  "request_id": "req_123",
  "media_url": "https://fal.media/files/...",
  "media_type": "image" // or "video"
}
```

## Contributing

1. **Fork** the repository
2. **Create** a feature branch
3. **Test** in browser (see Manual Testing Quirk above)
4. **Submit** a pull request

## License

MIT License - see LICENSE file for details.
