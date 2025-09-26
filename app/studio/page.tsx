"use client";
import { useState } from "react";
import { MKB } from "@/lib/mkb";

export default function Studio() {
  const [modelId, setModelId] = useState<keyof typeof MKB>("fal-ai/flux/dev");
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState("");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [debug, setDebug] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [manualCheck, setManualCheck] = useState(false);

  const checkResult = async () => {
    if (!requestId) return;

    setManualCheck(true);
    try {
      const checkRes = await fetch(`/api/fal/webhook/check?requestId=${requestId}`).then(r => r.json());
      const mediaUrl = checkRes?.media_url;
      if (mediaUrl) {
        setDebug(checkRes);
        setResultUrl(mediaUrl);
        setStatus("Done (manual check)");
      } else {
        setStatus("Still pending - try again in 30s");
      }
    } catch (e) {
      setStatus("Check failed");
    }
    setManualCheck(false);
  };

  const run = async () => {
    if (busy) return;
    setBusy(true);
    setResultUrl(null);
    setStatus("Submitting…");
    setDebug(null);

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId, prompt, params: {}, useWebhook: true }),
    }).then(r => r.json());

    const media = res?.media_url as string | undefined;
    if (media) {
      setDebug(res);
      setResultUrl(media);
      setStatus("Done (immediate)");
      setBusy(false);
      return;
    }

    // Job submitted with webhook - poll for completion
    const reqId = res?.request_id;
    if (reqId && res?.webhook_enabled) {
      setStatus("Waiting for webhook…");
      setRequestId(reqId);

      // Poll for webhook result
      for (let i = 0; i < 60; i++) { // 60 attempts = ~2 minutes
        await new Promise(r => setTimeout(r, 2000));

        try {
          const checkRes = await fetch(`/api/fal/webhook/check?requestId=${reqId}`).then(r => r.json());
          const mediaUrl = checkRes?.media_url;
          if (mediaUrl) {
            setDebug(checkRes);
            setResultUrl(mediaUrl);
            setStatus("Done (webhook)");
            setBusy(false);
            return;
          }
        } catch (e) {
          // Continue polling
        }
      }

      setStatus("Timeout - still processing on server");
    } else {
      setDebug(res);
      setStatus(res?.error || "Failed to submit job");
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
          {busy ? "Running…" : "Generate"}
        </button>
        {requestId && (
          <button onClick={checkResult} disabled={manualCheck} className="px-4 py-2 rounded border">
            {manualCheck ? "Checking…" : "Check Result"}
          </button>
        )}
        <span className="text-sm text-gray-500">{status}{requestId ? ` · job ${requestId}` : ""}</span>
      </div>
      <textarea className="w-full border p-3 rounded min-h-[120px]" placeholder="Describe your shot…" value={prompt} onChange={e => setPrompt(e.target.value)} />
      {resultUrl && (
        <div className="space-y-2">
          <a className="underline" href={resultUrl} target="_blank">Open Result</a>
          <div className="rounded overflow-hidden border">
            {/\.(mp4|webm)$/i.test(resultUrl) ? <video controls src={resultUrl} className="w-full" /> : <img src={resultUrl} className="w-full" />}
          </div>
        </div>
      )}
      {debug && <pre className="text-xs bg-gray-50 border p-2 rounded overflow-auto">{JSON.stringify(debug, null, 2)}</pre>}
    </main>
  );
}
