export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { MKB } from "@/lib/mkb";
import { ensureFalImageUrl } from "@/lib/falImage";

// Configure FAL client
fal.config({
  credentials: process.env.FAL_KEY,
});

function baseUrl() {
  return (
    process.env.PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}`  : "http://localhost:3000")
  );
}


export async function POST(req: NextRequest) {
  try {
    // NOTE: Vercel may return "Authentication Required" for direct API calls (curl, etc.)
    // but browser requests work normally. This is Vercel's API protection, not a bug.
    // Always test functionality through the browser interface.

    const body = await req.json();
    const { modelId, prompt, params } = body;
    const model = (MKB as any)[modelId];
    if (!model) return NextResponse.json({ error: "Unknown model" }, { status: 400 });

    console.log("[env] FAL_KEY set?", Boolean(process.env.FAL_KEY));

    console.log("Generating with model:", modelId);
    console.log("Prompt:", prompt);
    console.log("Params:", params);

    // Special handling for lip sync and Seedance - use queue.submit() for long-running jobs
    if (modelId === "fal-ai/sync-lipsync/v2/pro") {
      console.log("Starting lip sync job with queue...");

      // Submit to queue and get request ID
      const queueResult = await fal.queue.submit(modelId, {
        input: {
          prompt,
          ...params,
        },
        webhookUrl: `${baseUrl()}/api/generate/webhook`,
      });

      console.log("Lip sync job submitted:", queueResult.request_id);

      // Return immediately - frontend will poll for status
      return NextResponse.json({
        request_id: queueResult.request_id,
        status: "IN_QUEUE",
        message: "Lip sync job queued. This may take several minutes...",
        poll_url: `/api/generate/status?request_id=${queueResult.request_id}`,
        raw: queueResult
      });
    }

    // Special handling for Seedance - use queue.submit() for long-running jobs
    if (modelId === "fal-ai/bytedance/seedance/v1/pro/image-to-video") {
      console.log("Starting Seedance video generation job with queue...");
      console.log("[seedance] params received:", params);

      // Get image_url from params (set by studio page)
      const imageUrl = params?.image_url;
      if (!imageUrl) {
        return NextResponse.json(
          { error: "image_url required in params" },
          { status: 400 }
        );
      }

      // Validate image dimensions for Seedance (max 6000px width)
      try {
        const imageResponse = await fetch(imageUrl, { method: 'HEAD' });
        if (!imageResponse.ok) {
          return NextResponse.json(
            { error: "Unable to access image URL" },
            { status: 400 }
          );
        }

        // Note: We can't get dimensions from HEAD request alone
        // The validation will happen on FAL side, but we can provide better error message
        console.log("[seedance] image URL accessible:", imageUrl);
      } catch (e) {
        console.log("[seedance] image URL check failed:", e);
        return NextResponse.json(
          { error: "Image URL is not accessible" },
          { status: 400 }
        );
      }

      const input = {
        prompt,
        image_url: imageUrl
      };

      console.log("[seedance] submitting with input:", JSON.stringify(input));

      try {
        const submit = await fal.queue.submit("fal-ai/bytedance/seedance/v1/pro/image-to-video", {
          input,
          webhookUrl: `${baseUrl()}/api/generate/webhook`,
        });

        console.log("Seedance job submitted:", submit.request_id);

        // Return immediately - frontend will poll for status
        return NextResponse.json({
          request_id: submit.request_id,
          status: "IN_QUEUE",
          message: "Seedance video generation queued. This may take a few minutes...",
          poll_url: `/api/generate/status?request_id=${submit.request_id}&model_id=${encodeURIComponent(modelId)}`,
          raw: submit
        });
      } catch (e: any) {
        const status = (e?.response?.status) || 500;
        const data = (e?.response?.data) || { message: String(e?.message || e) };
        console.log("[seedance][submit][err]", status, data);
        
        // Provide better error message for common issues
        let errorMessage = "Seedance submission failed";
        if (status === 422) {
          errorMessage = "Image validation failed. Please ensure your image is under 6000px width and in a supported format (JPEG, PNG, WebP).";
        }
        
        return NextResponse.json({ 
          error: errorMessage, 
          details: data,
          stage: "submit" 
        }, { status });
      }
    }

    // Use fal.subscribe() which handles async operations automatically for other models
    const result = await fal.subscribe(modelId, {
      input: {
        prompt,
        ...params,
      },
    });

    console.log("FAL result:", JSON.stringify(result, null, 2));

    // Extract the media URL from the result
    const mediaUrl =
      (result as any)?.data?.images?.[0]?.url ||
      (result as any)?.data?.video?.url ||
      (result as any)?.images?.[0]?.url ||
      (result as any)?.video?.url ||
      (result as any)?.output?.[0]?.url ||
      null;

    if (!mediaUrl) {
      console.error("No media URL found in result:", result);
      return NextResponse.json({ error: "No media URL in result", raw: result }, { status: 502 });
    }

    return NextResponse.json({
      request_id: (result as any).request_id || (result as any).requestId || "completed",
      media_url: mediaUrl,
      media_type: model.type, // "image" or "video"
      raw: result
    });

  } catch (error: any) {
    console.error("FAL API error:", error);
    console.error("Error details:", {
      message: error?.message,
      stack: error?.stack,
      response: error?.response?.data
    });
    return NextResponse.json({
      error: "Failed to generate media",
      details: error?.message || "Unknown error",
      raw: error
    }, { status: 500 });
  }
}
