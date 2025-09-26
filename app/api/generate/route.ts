import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { MKB } from "@/lib/mkb";

// Configure FAL client
fal.config({
  credentials: process.env.FAL_KEY,
});

export async function POST(req: NextRequest) {
  try {
    // NOTE: Vercel may return "Authentication Required" for direct API calls (curl, etc.)
    // but browser requests work normally. This is Vercel's API protection, not a bug.
    // Always test functionality through the browser interface.

    const { modelId, prompt, params } = await req.json();
    const model = (MKB as any)[modelId];
    if (!model) return NextResponse.json({ error: "Unknown model" }, { status: 400 });

    console.log("Generating with model:", modelId);
    console.log("Prompt:", prompt);
    console.log("Params:", params);

    // Use fal.subscribe() which handles async operations automatically
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
