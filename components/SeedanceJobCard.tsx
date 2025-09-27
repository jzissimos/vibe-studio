"use client";

import { useEffect, useRef, useState } from "react";
import { runSeedance } from "@/lib/seedance/client";

export default function SeedanceJobCard() {
  const [prompt, setPrompt] = useState("cinematic dolly on a vintage car at sunset");
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1502877338535-766e1452684a");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const alive = useRef(true);

  useEffect(() => { return () => { alive.current = false; }; }, []);

  async function onRun() {
    setLoading(true);
    setError(null);
    setResultUrl(null);
    try {
      const { url } = await runSeedance(prompt, imageUrl);
      if (alive.current) setResultUrl(url);
    } catch (e: any) {
      if (alive.current) setError(e?.message || "Failed");
    } finally {
      if (alive.current) setLoading(false);
    }
  }

  return (
    <div className="max-w-xl w-full border rounded-lg p-4 space-y-3">
      <h2 className="text-lg font-semibold">Seedance: Image → Video</h2>

      <label className="block text-sm">Prompt</label>
      <input
        className="w-full border rounded px-3 py-2"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <label className="block text-sm">Image URL</label>
      <input
        className="w-full border rounded px-3 py-2"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
      />
      <div className="text-xs text-gray-500">Must be publicly reachable (content-type image/*).</div>

      <button
        className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        onClick={onRun}
        disabled={loading}
      >
        {loading ? "Generating…" : "Generate Video"}
      </button>

      {error && <div className="text-sm text-red-600">{error}</div>}

      {resultUrl && (
        <div className="space-y-2">
          <div className="text-sm break-all">
            <b>Media URL:</b> <a className="underline" href={resultUrl} target="_blank">{resultUrl}</a>
          </div>
          <video controls src={resultUrl} className="w-full rounded" />
        </div>
      )}
    </div>
  );
}
