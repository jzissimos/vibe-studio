import { fal } from "@fal-ai/client";

const FAL_HOST_PAT = /^(https?:\/\/(v\d+\.)?fal\.media\/|https?:\/\/storage\.googleapis\.com\/falserverless\/)/i;

export function isFalUrl(url: string) {
  return FAL_HOST_PAT.test(url);
}

export async function toFalUrlFromRemote(remoteUrl: string): Promise<string> {
  // If your codebase already has a helper for fal.storage.upload, reuse it instead of this body.
  // Otherwise, fetch the image and upload bytes to FAL.
  const res = await fetch(remoteUrl, { method: "GET" });
  if (!res.ok) throw new Error(`fetch image failed: ${res.status}` );
  const contentType = res.headers.get("content-type") || "application/octet-stream";
  const arrayBuf = await res.arrayBuffer();

  // Try the common upload signature; if the repo already uses fal.storage.upload elsewhere, copy that usage.
  const uploaded: any = await (fal as any).storage.upload({
    data: Buffer.from(arrayBuf),
    contentType,
    // name is optional; helpful for diagnostics
    name: `seedance_${Date.now()}` 
  });

  const url = uploaded?.url || uploaded?.data?.url || uploaded?.public_url || null;
  if (!url) throw new Error("fal.storage.upload returned no url");
  return url as string;
}

export async function ensureFalImageUrl(imageUrl: string): Promise<string> {
  return isFalUrl(imageUrl) ? imageUrl : await toFalUrlFromRemote(imageUrl);
}
