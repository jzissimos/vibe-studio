"use client";
import { useState } from "react";
import { MKB } from "@/lib/mkb";

function isNonPublicUrl(u: string) {
  return /^data:/i.test(u) || /blob\.vercel-storage\.com/i.test(u);
}

async function rehostToFal(url: string): Promise<string> {
  // Only rehost if it's a Vercel blob URL (the upload API only handles these)
  if (!url.includes('blob.vercel-storage.com')) return url;

  const r = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blobUrl: url })
  });
  const j = await r.json();
  return (j?.url as string) || url;
}

export default function Studio() {
  const [modelId, setModelId] = useState<keyof typeof MKB>("fal-ai/flux/dev");
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [duration, setDuration] = useState<"5" | "10">("5");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("16:9");
  const [imageUrl, setImageUrl] = useState("");
  const [endImageUrl, setEndImageUrl] = useState("");
  const [promptOptimizer, setPromptOptimizer] = useState(true);
  const [videoUrl, setVideoUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [syncMode, setSyncMode] = useState<"cut_off" | "loop" | "bounce" | "silence" | "remap">("cut_off");
  const [uploadingEndImage, setUploadingEndImage] = useState(false);
  const [status, setStatus] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [debug, setDebug] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dbgPayload, setDbgPayload] = useState<any>(null);
  const [dbgStartResp, setDbgStartResp] = useState<any>(null);
  // Seedance parameters
  const [seedanceAspectRatio, setSeedanceAspectRatio] = useState<"21:9" | "16:9" | "4:3" | "1:1" | "3:4" | "9:16" | "auto">("auto");
  const [seedanceResolution, setSeedanceResolution] = useState<"480p" | "720p" | "1080p">("1080p");
  const [seedanceDuration, setSeedanceDuration] = useState<"3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12">("5");
  const [seedanceCameraFixed, setSeedanceCameraFixed] = useState(false);
  const [seedanceSeed, setSeedanceSeed] = useState("");
  const [seedanceSafetyChecker, setSeedanceSafetyChecker] = useState(true);

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      // Check file size - Vercel has a hard 4.5MB limit for serverless functions
      const maxDirectUploadSize = 4.5 * 1024 * 1024; // 4.5MB
      if (file.size > maxDirectUploadSize) {
        // Use Vercel Blob client-side upload for large files
        try {
          const { upload } = await import('@vercel/blob/client');

          // Upload directly to Vercel Blob (client-side, uses auto-generated token)
          const result = await upload(file.name, file, {
            access: 'public',
            handleUploadUrl: '/api/blob/upload',
          });

          // Now process the blob URL through our upload API to get FAL URL
          const formData = new FormData();
          formData.append("blobUrl", result.url);

          const response = await fetch("/api/upload", {
            method: "POST",
            headers: {
              'x-model-id': modelId // Send model ID so server knows file size limits
            },
            body: formData,
          });

          const data = await response.json();

          if (data.error) {
            throw new Error(data.error);
          }

          setImageUrl(data.url);
        } catch (blobError) {
          console.error('Blob upload failed:', blobError);
          alert(`Large file upload failed: ${blobError instanceof Error ? blobError.message : 'Unknown error'}`);
          return;
        }
      } else {
        // Direct upload for smaller files (current working method)
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          headers: {
            'x-model-id': modelId // Send model ID so server knows file size limits
          },
          body: formData,
        });

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        setImageUrl(data.url);
      }
    } catch (error: any) {
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    
    // Client-side validation - allow up to 20MB for any image (server validates per model)
    const maxSize = 20 * 1024 * 1024; // 20MB (maximum for MiniMax)
    if (file.size > maxSize) {
      alert(`File too large. Please select an image smaller than 20MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`);
      return;
    }
    
    uploadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const uploadEndImageFile = async (file: File) => {
    setUploadingEndImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          'x-model-id': modelId // Send model ID so server knows file size limits
        },
        body: formData,
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setEndImageUrl(data.url);
    } catch (error: any) {
      alert(`End image upload failed: ${error.message}`);
    } finally {
      setUploadingEndImage(false);
    }
  };

  const uploadVideoFile = async (file: File) => {
    setUploading(true);
    try {
      // Check file size - Vercel has a hard 4.5MB limit for serverless functions
      const maxDirectUploadSize = 4.5 * 1024 * 1024; // 4.5MB
      if (file.size > maxDirectUploadSize) {
        // Use Vercel Blob client-side upload for large videos
        try {
          const { upload } = await import('@vercel/blob/client');

          // Upload directly to Vercel Blob (client-side, uses auto-generated token)
          const result = await upload(file.name, file, {
            access: 'public',
            handleUploadUrl: '/api/blob/upload',
          });

          // Now process the blob URL through our upload API to get FAL URL
          const formData = new FormData();
          formData.append("blobUrl", result.url);

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          const data = await response.json();

          if (data.error) {
            throw new Error(data.error);
          }

          setVideoUrl(data.url);
        } catch (blobError) {
          console.error('Video blob upload failed:', blobError);
          alert(`Large video upload failed: ${blobError instanceof Error ? blobError.message : 'Unknown error'}`);
          return;
        }
      } else {
        // Direct upload for smaller videos (current method)
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        setVideoUrl(data.url);
      }
    } catch (error: any) {
      alert(`Video upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const pollLipSyncStatus = async (requestId: string, modelId: string) => {
    try {
      const url = `/api/generate/status?request_id=${encodeURIComponent(requestId)}&model_id=${encodeURIComponent(modelId)}`;
      const res = await fetch(url);
      const statusData = await res.json();

      if (statusData.status === "COMPLETE" && statusData.media_url) {
        // Job completed successfully
        setResultUrl(statusData.media_url);
        setMediaType(statusData.media_type || "video");
        setStatus(statusData.message || "Generation completed!");
        setDebug(statusData);
        return;
      }

      if (statusData.status === "FAILED") {
        // Job failed
        setStatus(statusData.message || `Generation failed: ${statusData.details || statusData.error}`);
        setDebug(statusData);
        return;
      }

      // Still processing - poll again in 10 seconds
      setStatus(statusData.message || `Status: ${statusData.status}`);
      setTimeout(() => pollLipSyncStatus(requestId, modelId), 10000);

    } catch (error: any) {
      setStatus("Error checking generation status");
      setDebug({ error: error?.message || "Unknown polling error" });
    }
  };

  const uploadAudioFile = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setAudioUrl(data.url);
    } catch (error: any) {
      alert(`Audio upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleVideoFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    // Model-specific video size limits - no limit for lip sync
    const isSyncLipSync = modelId === "fal-ai/sync-lipsync/v2/pro";
    const maxSize = isSyncLipSync ? Number.MAX_SAFE_INTEGER : 100 * 1024 * 1024; // No limit for lip sync, 100MB for others
    if (file.size > maxSize) {
      alert(`File too large. Please select a video smaller than 100MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`);
      return;
    }

    uploadVideoFile(file);
  };

  const handleAudioFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    
    // Client-side validation
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert(`File too large. Please select an audio file smaller than 10MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`);
      return;
    }
    
    uploadAudioFile(file);
  };

  const handleEndImageFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    
    // Client-side validation - allow up to 20MB for end images (server validates per model)
    const maxSize = 20 * 1024 * 1024; // 20MB (maximum for MiniMax)
    if (file.size > maxSize) {
      alert(`File too large. Please select an image smaller than 20MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`);
      return;
    }
    
    uploadEndImageFile(file);
  };

  const run = async () => {
    if (busy) return;
    setBusy(true);
    setResultUrl(null);
    setMediaType(null);
    setStatus("Generating…");
    setDebug(null);

    try {
      const params: any = {};
      
      // Add model-specific parameters
      if (modelId === "fal-ai/kling-video/v2.5-turbo/pro/text-to-video") {
        params.duration = duration;
        params.aspect_ratio = aspectRatio;
        if (negativePrompt.trim()) {
          params.negative_prompt = negativePrompt;
        }
      } else if (modelId === "fal-ai/kling-video/v2.5-turbo/pro/image-to-video") {
        params.duration = duration;
        params.image_url = imageUrl;
        if (negativePrompt.trim()) {
          params.negative_prompt = negativePrompt;
        }
      } else if (modelId === "fal-ai/minimax/hailuo-02/pro/image-to-video") {
        params.image_url = imageUrl;
        params.prompt_optimizer = promptOptimizer;
        if (endImageUrl.trim()) {
          params.end_image_url = endImageUrl;
        }
      } else if (modelId === "fal-ai/sync-lipsync/v2/pro") {
        params.video_url = videoUrl;
        params.audio_url = audioUrl;
        params.sync_mode = syncMode;
      } else if (modelId === "fal-ai/bytedance/seedance/v1/pro/image-to-video") {
        /** Seedance: Image → Video - Use standard queue flow **/
        // Guard to avoid 422
        if (!imageUrl || !/^https?:\/\//i.test(imageUrl.trim())) {
          alert("Seedance requires a public http(s) image URL.");
          return;
        }
        
        // Set image_url in params for the standard flow
        params.image_url = imageUrl;
        console.log("[seedance] using standard queue flow", { imageUrl, prompt, modelId });
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId, prompt, params }),
      });

      const data = await res.json();
      if ((modelId === "fal-ai/sync-lipsync/v2/pro" || modelId === "fal-ai/bytedance/seedance/v1/pro/image-to-video") && data.request_id && data.status === "IN_QUEUE") {
        // Start polling for completion
        const modelName = modelId === "fal-ai/sync-lipsync/v2/pro" ? "lip sync" : "Seedance";
        setStatus(`${modelName} queued. Polling for completion...`);
        pollLipSyncStatus(data.request_id, modelId);
        return;
      }

      if (data.error) {
        setDebug(data);
        setStatus(`Error: ${data.error}`);
      } else if (data.media_url) {
        setDebug(data);
        setResultUrl(data.media_url);
        setMediaType(data.media_type || "image");
        setStatus("Done!");
      } else {
        setDebug(data);
        setStatus("Unexpected response");
      }
    } catch (error: any) {
      setStatus("Network error");
      setDebug({ error: error?.message || "Unknown error" });
    }

    setBusy(false);
  };

  const selectedModel = MKB[modelId];
  const requiresImage = selectedModel.requiresImage;
  const isKlingTextToVideo = modelId === "fal-ai/kling-video/v2.5-turbo/pro/text-to-video";
  const isKlingImageToVideo = modelId === "fal-ai/kling-video/v2.5-turbo/pro/image-to-video";
  const isMiniMaxImageToVideo = modelId === "fal-ai/minimax/hailuo-02/pro/image-to-video";
  const isSyncLipSync = modelId === "fal-ai/sync-lipsync/v2/pro";
  const isSeedanceImageToVideo = modelId === "fal-ai/bytedance/seedance/v1/pro/image-to-video";

  return (
    <main className="p-6 space-y-4 max-w-4xl">
      <h1 className="text-2xl font-semibold">Vibe Studio</h1>
      <div className="flex gap-2 items-center">
        <select className="border p-2 rounded" value={modelId} onChange={e => setModelId(e.target.value as any)}>
          {Object.entries(MKB).map(([id, m]) => <option key={id} value={id}>{m.name}</option>)}
        </select>
        <button onClick={run} disabled={busy} className={`px-4 py-2 rounded text-white ${busy ? "bg-gray-400" : "bg-black"}` }>
          {busy ? "Generating…" : "Generate"}
        </button>
        <span className="text-sm text-gray-500">{status}</span>
      </div>
      
      {!isSyncLipSync && (
        <textarea 
          className="w-full border p-3 rounded min-h-[120px]" 
          placeholder={
            requiresImage 
              ? "Describe the motion/action to add to your image…" 
              : "Describe your shot…"
          } 
          value={prompt} 
          onChange={e => setPrompt(e.target.value)} 
        />
      )}

      {/* Image URL input for image-to-video models */}
      {requiresImage && (
        <div>
          <label className="block text-sm font-medium mb-1">Input Image</label>
          
          {/* Drag and drop area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              uploading ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {imageUrl ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <img src={imageUrl} alt="Input image" className="max-w-xs max-h-48 rounded border shadow-sm" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Image uploaded successfully!</p>
                  <button
                    onClick={() => setImageUrl("")}
                    className="text-sm text-red-600 hover:text-red-800 underline"
                  >
                    Remove image
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-gray-400">
                  <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    {uploading ? "Uploading..." : "Drop your image here"}
                  </p>
                  <p className="text-sm text-gray-500">
                    or{" "}
                    <label className="text-blue-600 hover:text-blue-800 cursor-pointer underline">
                      browse to choose a file
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFileSelect(e.target.files)}
                        disabled={uploading}
                      />
                    </label>
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Supports JPEG, PNG, WebP, GIF, AVIF (max 20MB)
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Alternative: URL input */}
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Or enter image URL directly</label>
            <input
              type="url"
              className="w-full border p-2 rounded"
              placeholder="https://example.com/your-image.jpg"
              value={imageUrl.startsWith("https://") ? imageUrl : ""}
              onChange={(e) => {
                if (e.target.value) setImageUrl(e.target.value);
              }}
            />
          </div>
        </div>
      )}

      {/* Video and Audio inputs for lip sync models */}
      {isSyncLipSync && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Video Input */}
          <div>
            <label className="block text-sm font-medium mb-1">Input Video</label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                uploading ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"
              }`}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleVideoFileSelect(e.dataTransfer.files);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              {videoUrl ? (
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <video src={videoUrl} className="max-w-xs max-h-32 rounded border shadow-sm" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Video uploaded!</p>
                    <button
                      onClick={() => setVideoUrl("")}
                      className="text-sm text-red-600 hover:text-red-800 underline"
                    >
                      Remove video
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-gray-400">
                    <svg className="mx-auto h-10 w-10" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M34 24l-8-8-8 8V8h16v16z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M14 32h20v8H14v-8z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {uploading ? "Uploading..." : "Drop video here"}
                    </p>
                    <p className="text-xs text-gray-500">
                      or{" "}
                      <label className="text-blue-600 hover:text-blue-800 cursor-pointer underline">
                        browse
                        <input
                          type="file"
                          className="hidden"
                          accept="video/*"
                          onChange={(e) => handleVideoFileSelect(e.target.files)}
                          disabled={uploading}
                        />
                      </label>
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-2">
              <input
                type="url"
                className="w-full border p-2 rounded text-sm"
                placeholder="https://example.com/video.mp4"
                value={videoUrl.startsWith("https://") ? videoUrl : ""}
                onChange={(e) => {
                  if (e.target.value) setVideoUrl(e.target.value);
                }}
              />
            </div>
          </div>

          {/* Audio Input */}
          <div>
            <label className="block text-sm font-medium mb-1">Input Audio</label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                uploading ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"
              }`}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAudioFileSelect(e.dataTransfer.files);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              {audioUrl ? (
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <div className="bg-gray-100 p-4 rounded-full">
                      <svg className="h-8 w-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Audio uploaded!</p>
                    <button
                      onClick={() => setAudioUrl("")}
                      className="text-sm text-red-600 hover:text-red-800 underline"
                    >
                      Remove audio
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-gray-400">
                    <svg className="mx-auto h-10 w-10" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M20 28h8v-8h-8v8zm0-12h8v-8h-8v8zm12 0h8v-8h-8v8zM8 40h32V8H8v32z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {uploading ? "Uploading..." : "Drop audio here"}
                    </p>
                    <p className="text-xs text-gray-500">
                      or{" "}
                      <label className="text-blue-600 hover:text-blue-800 cursor-pointer underline">
                        browse
                        <input
                          type="file"
                          className="hidden"
                          accept="audio/*"
                          onChange={(e) => handleAudioFileSelect(e.target.files)}
                          disabled={uploading}
                        />
                      </label>
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-2">
              <input
                type="url"
                className="w-full border p-2 rounded text-sm"
                placeholder="https://example.com/audio.mp3"
                value={audioUrl.startsWith("https://") ? audioUrl : ""}
                onChange={(e) => {
                  if (e.target.value) setAudioUrl(e.target.value);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Kling-specific controls */}
      {(isKlingTextToVideo || isKlingImageToVideo || isMiniMaxImageToVideo || isSyncLipSync || isSeedanceImageToVideo) && (
        <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
          <h3 className="font-semibold">Video Settings</h3>
          
          {(isKlingTextToVideo || isKlingImageToVideo) && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Duration</label>
                <select 
                  className="border p-2 rounded w-full" 
                  value={duration} 
                  onChange={e => setDuration(e.target.value as "5" | "10")}
                >
                  <option value="5">5 seconds</option>
                  <option value="10">10 seconds</option>
                </select>
              </div>
              
              {/* Aspect ratio only for text-to-video */}
              {isKlingTextToVideo && (
                <div>
                  <label className="block text-sm font-medium mb-1">Aspect Ratio</label>
                  <select 
                    className="border p-2 rounded w-full" 
                    value={aspectRatio} 
                    onChange={e => setAspectRatio(e.target.value as "16:9" | "9:16" | "1:1")}
                  >
                    <option value="16:9">16:9 (Landscape)</option>
                    <option value="9:16">9:16 (Portrait)</option>
                    <option value="1:1">1:1 (Square)</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Sync Lip Sync controls */}
          {isSyncLipSync && (
            <div>
              <label className="block text-sm font-medium mb-1">Sync Mode</label>
              <select 
                className="border p-2 rounded w-full max-w-xs" 
                value={syncMode} 
                onChange={e => setSyncMode(e.target.value as "cut_off" | "loop" | "bounce" | "silence" | "remap")}
              >
                <option value="cut_off">Cut Off - Truncate to shorter duration</option>
                <option value="loop">Loop - Repeat shorter content</option>
                <option value="bounce">Bounce - Play back and forth</option>
                <option value="silence">Silence - Add silence to match</option>
                <option value="remap">Remap - Stretch to match duration</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                How to handle when video and audio durations don&apos;t match
              </p>
            </div>
          )}

          {/* MiniMax-specific controls */}
          {isMiniMaxImageToVideo && (
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={promptOptimizer}
                    onChange={e => setPromptOptimizer(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">Enable Prompt Optimizer</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Automatically optimizes your prompt for better results
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">End Image (Optional)</label>
                
                {/* Drag and drop area for end image */}
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    uploadingEndImage ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                  }`}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleEndImageFileSelect(e.dataTransfer.files);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  {endImageUrl ? (
                    <div className="space-y-3">
                      <div className="flex justify-center">
                        <img src={endImageUrl} alt="End frame" className="max-w-xs max-h-32 rounded border shadow-sm" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">End frame uploaded!</p>
                        <button
                          onClick={() => setEndImageUrl("")}
                          className="text-sm text-red-600 hover:text-red-800 underline"
                        >
                          Remove end image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-gray-400">
                        <svg className="mx-auto h-8 w-8" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {uploadingEndImage ? "Uploading..." : "Drop end image here"}
                        </p>
                        <p className="text-xs text-gray-500">
                          or{" "}
                          <label className="text-blue-600 hover:text-blue-800 cursor-pointer underline">
                            browse
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => handleEndImageFileSelect(e.target.files)}
                              disabled={uploadingEndImage}
                            />
                          </label>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Alternative: URL input */}
                <div className="mt-3">
                  <input
                    type="url"
                    className="w-full border p-2 rounded text-sm"
                    placeholder="https://example.com/end-frame.jpg"
                    value={endImageUrl.startsWith("https://") ? endImageUrl : ""}
                    onChange={(e) => {
                      if (e.target.value) setEndImageUrl(e.target.value);
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Image to use as the last frame (optional)
                </p>
              </div>
            </div>
          )}

          {/* Seedance-specific controls - simplified per API docs */}
          {isSeedanceImageToVideo && (
            <div className="text-sm text-gray-600">
              <p>Seedance generates a 5-second video with automatic motion from your image and prompt.</p>
            </div>
          )}
          
          {/* Negative prompts for Kling models only */}
          {(isKlingTextToVideo || isKlingImageToVideo) && (
            <div>
              <label className="block text-sm font-medium mb-1">Negative Prompt (Optional)</label>
              <input
                type="text"
                className="w-full border p-2 rounded"
                placeholder="blur, distort, low quality"
                value={negativePrompt}
                onChange={e => setNegativePrompt(e.target.value)}
              />
            </div>
          )}
        </div>
      )}

      {resultUrl && (
        <div className="space-y-2">
          <a className="underline" href={resultUrl} target="_blank">Open Result</a>
          <div className="rounded overflow-hidden border">
            {mediaType === "video" ? (
              <video controls src={resultUrl} className="w-full max-h-96" />
            ) : (
              <img src={resultUrl} alt="Generated result" className="w-full" />
            )}
          </div>
        </div>
      )}
      
      {debug && <pre className="text-xs bg-gray-50 border p-2 rounded overflow-auto">{JSON.stringify(debug, null, 2)}</pre>}

      {(dbgPayload || dbgStartResp) && (
        <details className="mt-4 border rounded p-3 text-xs">
          <summary>Seedance Debug (payload & start response)</summary>
          {dbgPayload && (
            <>
              <div className="font-semibold mt-2">Outgoing Payload</div>
              <pre className="whitespace-pre-wrap break-all">{JSON.stringify(dbgPayload, null, 2)}</pre>
            </>
          )}
          {dbgStartResp && (
            <>
              <div className="font-semibold mt-2">/api/generate Start Response</div>
              <pre className="whitespace-pre-wrap break-all">{JSON.stringify(dbgStartResp, null, 2)}</pre>
            </>
          )}
        </details>
      )}
    </main>
  );
}
