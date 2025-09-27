"use client";

import { useEffect, useRef, useState } from "react";

type StartResp = { request_id?: string; message?: string; ok?: boolean; error?: string };
type StatusResp = { status?: string; media_url?: string | null; media_type?: string; message?: string; progress?: any };

const DEFAULT_MODEL = "fal-ai/bytedance/seedance/v1/pro/image-to-video";
const DEFAULT_PROMPT = "cinematic dolly on a vintage car at sunset";
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1502877338535-766e1452684a";

export default function Page() {
  const [modelId, setModelId] = useState(DEFAULT_MODEL);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [imageUrl, setImageUrl] = useState(DEFAULT_IMAGE);
  const [extraParams, setExtraParams] = useState<string>("{}"); // JSON
  const [requestId, setRequestId] = useState("");
  const [startJson, setStartJson] = useState<StartResp | null>(null);
  const [statusJson, setStatusJson] = useState<StatusResp | null>(null);
  const [uiError, setUiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const timer = useRef<any>(null);
  const alive = useRef(true);

  useEffect(() => () => { alive.current = false; if (timer.current) clearInterval(timer.current); }, []);

  function modelNeedsImage(id: string) {
    // simple heuristic: image-to-video and video-to-video need an image/video URL
    return /image-to-video|i2v|video-to-video|v2v/i.test(id);
  }

  async function submitJob() {
    setUiError(null);
    setStartJson(null);
    setStatusJson(null);
    setRequestId("");
    setLoading(true);
    try {
      // basic guard to avoid 422s on I2V
      if (modelNeedsImage(modelId)) {
        if (!imageUrl || !/^https?:\/\//i.test(imageUrl)) {
          setUiError("Provide a valid http(s) Image URL for this model.");
          return;
        }
      }
      let parsed: any = {};
      try { parsed = JSON.parse(extraParams || "{}"); } catch { parsed = {}; }

      const body = {
        modelId,
        prompt,
        params: { ...(imageUrl ? { image_url: imageUrl } : {}), ...parsed }
      };

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const json: StartResp = await res.json();
      setStartJson(json);
      if (json?.request_id) setRequestId(json.request_id);
    } catch (e: any) {
      setStartJson({ ok: false, error: e?.message || String(e) });
    } finally {
      setLoading(false);
    }
  }

  async function pollOnce(id: string) {
    const res = await fetch(`/api/generate/status?request_id=${encodeURIComponent(id)}&model_id=${encodeURIComponent(modelId)}` );
    const json: StatusResp = await res.json();
    if (!alive.current) return;
    setStatusJson(json);
    if (json.status === "COMPLETED" || json.status === "FAILED") stopPolling();
  }

  function startPolling() {
    if (!requestId || polling) return;
    setPolling(true);
    pollOnce(requestId);
    timer.current = setInterval(() => pollOnce(requestId), 3000);
  }

  function stopPolling() {
    setPolling(false);
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }

  const mediaUrl = statusJson?.media_url;

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Model Debug Console</h1>
      <p className="text-sm text-gray-600">Submit to <code>/api/generate</code>, then poll <code>/api/generate/status</code> with model_id.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm">Model ID</label>
          <input className="w-full border rounded px-3 py-2" value={modelId} onChange={e=>setModelId(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">Image URL (if required)</label>
          <input className="w-full border rounded px-3 py-2" value={imageUrl} onChange={e=>setImageUrl(e.target.value)} />
          <div className="text-xs text-gray-500">Use a public image for I2V/V2V models.</div>
        </div>
      </div>

      <div>
        <label className="block text-sm">Prompt</label>
        <input className="w-full border rounded px-3 py-2" value={prompt} onChange={e=>setPrompt(e.target.value)} />
      </div>

      <div>
        <label className="block text-sm">Extra Params (JSON)</label>
        <textarea className="w-full border rounded px-3 py-2 font-mono text-sm" rows={4}
          value={extraParams} onChange={e=>setExtraParams(e.target.value)}
          placeholder='{"resolution":"1080p","duration":"5"}' />
      </div>

      {uiError && <div className="text-sm text-red-600">{uiError}</div>}

      <div className="flex gap-3 items-center">
        <button className="px-4 py-2 rounded bg-black text-white disabled:opacity-50" onClick={submitJob} disabled={loading}>
          {loading ? "Submitting…" : "Submit Job"}
        </button>
        <input className="flex-1 border rounded px-3 py-2" placeholder="request_id" value={requestId} onChange={e=>setRequestId(e.target.value)} />
        <button className="px-3 py-2 rounded border" onClick={startPolling} disabled={!requestId || polling}>Start Poll</button>
        <button className="px-3 py-2 rounded border" onClick={stopPolling} disabled={!polling}>Stop</button>
      </div>

      {(startJson || statusJson) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <pre className="border rounded p-3 text-xs overflow-auto whitespace-pre-wrap">{JSON.stringify(startJson, null, 2)}</pre>
          <pre className="border rounded p-3 text-xs overflow-auto whitespace-pre-wrap">{JSON.stringify(statusJson, null, 2)}</pre>
        </div>
      )}

      {mediaUrl && (
        <div className="space-y-2">
          <div className="text-sm break-all">
            <b>Media URL:</b> <a className="underline" href={mediaUrl} target="_blank">{mediaUrl}</a>
          </div>
          <video src={mediaUrl} controls className="w-full rounded" />
        </div>
      )}
    </div>
  );
}
