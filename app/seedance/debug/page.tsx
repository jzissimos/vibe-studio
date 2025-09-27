"use client";

import { useRef, useState } from "react";

export default function Page() {
  const [prompt, setPrompt] = useState("cinematic dolly on a vintage car at sunset");
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1502877338535-766e1452684a");
  const [requestId, setRequestId] = useState("");
  const [statusJson, setStatusJson] = useState<any>(null);
  const [uiError, setUiError] = useState<string | null>(null);
  const timer = useRef<any>(null);

  async function submitJob() {
    setUiError(null);
    if (!imageUrl || !/^https?:\/\//i.test(imageUrl.trim())) {
      setUiError("Image URL is required for Seedance (must be an http/https URL).");
      return;
    }

    const res = await fetch("/api/seedance/selftest", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-test-request": "true" },
      body: JSON.stringify({ prompt, imageUrl })
    });
    const json = await res.json();
    if (json?.request_id) {
      setRequestId(json.request_id);
      setUiError(null);
    }
    setStatusJson(json);
  }

  async function pollOnce() {
    if (!requestId) return;
    const r = await fetch(`/api/generate/status?request_id=${requestId}` );
    const j = await r.json();
    setStatusJson(j);
    if (j.status === "COMPLETED" || j.status === "FAILED") stop();
  }

  function start() {
    if (!requestId || timer.current) return;
    pollOnce();
    timer.current = setInterval(pollOnce, 3000);
  }
  function stop() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }

  const mediaUrl = statusJson?.media_url;

  return (
    <div style={{maxWidth: 800, margin: "40px auto", padding: 16}}>
      <h1>Seedance Debug</h1>

      <label>Prompt</label>
      <input style={{width:"100%", margin:"6px 0 12px"}} value={prompt} onChange={e=>setPrompt(e.target.value)} />

      <label>Image URL</label>
      <input style={{width:"100%", margin:"6px 0 12px"}} value={imageUrl} onChange={e=>setImageUrl(e.target.value)} />

      {uiError && <div style={{color: "red", fontSize: "14px", marginTop: "4px"}}>{uiError}</div>}

      <div style={{display:"flex", gap:8}}>
        <button onClick={submitJob}>Submit</button>
        <input style={{flex:1}} placeholder="request_id" value={requestId} onChange={e=>setRequestId(e.target.value)} />
        <button onClick={start}>Start Poll</button>
        <button onClick={stop}>Stop</button>
      </div>

      {mediaUrl ? (
        <div style={{marginTop:16}}>
          <div><b>Media URL:</b> <a href={mediaUrl} target="_blank">{mediaUrl}</a></div>
          <video src={mediaUrl} controls style={{width:"100%", marginTop:8}} />
        </div>
      ) : null}

      <pre style={{whiteSpace:"pre-wrap", marginTop:16, border:"1px solid #ddd", padding:12}}>
        {JSON.stringify(statusJson, null, 2)}
      </pre>
    </div>
  );
}
