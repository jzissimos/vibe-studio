export async function runSeedance(prompt: string, imageUrl: string) {
  const modelId = "fal-ai/bytedance/seedance/v1/pro/image-to-video";
  
  const start = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      modelId,
      prompt,
      params: { image_url: imageUrl }
    })
  }).then(r => r.json());

  const id: string = start?.request_id;
  if (!id) throw new Error("Seedance submit failed");

  for (;;) {
    // Pass model_id to status endpoint for correct queue operations
    const s = await fetch(`/api/generate/status?request_id=${id}&model_id=${encodeURIComponent(modelId)}`).then(r => r.json());
    
    // Handle both "COMPLETED" and "COMPLETE" status values
    if ((s?.status === "COMPLETED" || s?.status === "COMPLETE") && s?.media_url) {
      return { id, url: s.media_url as string };
    }
    if (s?.status === "FAILED") throw new Error(`Seedance failed: ${s?.error || s?.details || "Unknown error"}`);
    await new Promise(r => setTimeout(r, 3000));
  }
}
