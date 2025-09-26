"use client";
import { useState } from "react";
import { MKB } from "@/lib/mkb";

export default function Studio() {
  const [modelId, setModelId] = useState<keyof typeof MKB>("fal-ai/flux/dev");
  const [prompt, setPrompt] = useState("");
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
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId, prompt, params: {} }),
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

  return (
    <main className="p-6 space-y-4 max-w-3xl">
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
      <textarea className="w-full border p-3 rounded min-h-[120px]" placeholder="Describe your shot…" value={prompt} onChange={e => setPrompt(e.target.value)} />
      {resultUrl && (
        <div className="space-y-2">
          <a className="underline" href={resultUrl} target="_blank">Open Result</a>
          <div className="rounded overflow-hidden border">
            {mediaType === "video" ? (
              <video controls src={resultUrl} className="w-full" />
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
