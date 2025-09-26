"use client";
import { useState } from "react";
import { MKB } from "@/lib/mkb";

export default function Studio() {
  const [modelId, setModelId] = useState<keyof typeof MKB>("fal-ai/flux/dev");
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [duration, setDuration] = useState<"5" | "10">("5");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("16:9");
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [debug, setDebug] = useState<any>(null);
  const [busy, setBusy] = useState(false);

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
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId, prompt, params }),
      });

      const data = await res.json();

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
      
      <textarea 
        className="w-full border p-3 rounded min-h-[120px]" 
        placeholder={requiresImage ? "Describe the motion/action to add to your image…" : "Describe your shot…"} 
        value={prompt} 
        onChange={e => setPrompt(e.target.value)} 
      />

      {/* Image URL input for image-to-video models */}
      {requiresImage && (
        <div>
          <label className="block text-sm font-medium mb-1">Image URL</label>
          <input
            type="url"
            className="w-full border p-2 rounded"
            placeholder="https://example.com/your-image.jpg"
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
          />
          {imageUrl && (
            <div className="mt-2">
              <img src={imageUrl} alt="Input image" className="max-w-xs max-h-48 rounded border" />
            </div>
          )}
        </div>
      )}

      {/* Kling-specific controls */}
      {(isKlingTextToVideo || isKlingImageToVideo) && (
        <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
          <h3 className="font-semibold">Video Settings</h3>
          
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
        </div>
      )}

      {resultUrl && (
        <div className="space-y-2">
          <a className="underline" href={resultUrl} target="_blank">Open Result</a>
          <div className="rounded overflow-hidden border">
            {mediaType === "video" ? (
              <video controls src={resultUrl} className="w-full max-h-96" />
            ) : (
              <img src={resultUrl} className="w-full" />
            )}
          </div>
        </div>
      )}
      
      {debug && <pre className="text-xs bg-gray-50 border p-2 rounded overflow-auto">{JSON.stringify(debug, null, 2)}</pre>}
    </main>
  );
}
