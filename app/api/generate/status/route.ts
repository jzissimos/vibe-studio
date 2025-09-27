import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";

// Configure FAL client
fal.config({
  credentials: process.env.FAL_KEY,
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get('request_id');
    const modelId = searchParams.get('model_id') || "fal-ai/sync-lipsync/v2/pro"; // Default for backward compatibility

    if (!requestId) {
      return NextResponse.json({ error: "Missing request_id parameter" }, { status: 400 });
    }

    console.log("Checking status for request:", requestId);

    try {
      const status = await fal.queue.status(modelId, {
        requestId: requestId,
      });

      console.log("Job status:", status.status);

      if ((status as any).status === "IN_PROGRESS" || (status as any).status === "IN_QUEUE") {
        return NextResponse.json({
          status: (status as any).status,
          message: (status as any).status === "IN_QUEUE" ? "Job queued..." : "Processing...",
          progress: status,
        });
      }

      if ((status as any).status === "COMPLETE" || (status as any).status === "COMPLETED") {
        const result = await fal.queue.result(modelId, {
          requestId: requestId,
        });

        // Extract the media URL from the result - handle different model response formats
        const mediaUrl = 
          (result as any)?.data?.video?.url || 
          (result as any)?.data?.output?.[0]?.url || 
          (result as any)?.video?.url ||
          (result as any)?.output?.url || // Seedance format
          (result as any)?.url; // Alternative format

        if (!mediaUrl) {
          console.error("No media URL found in completed job:", result);
          return NextResponse.json({
            error: "Job completed but no media URL found",
            raw: result
          }, { status: 502 });
        }

        return NextResponse.json({
          request_id: requestId,
          status: "COMPLETE",
          media_url: mediaUrl,
          media_type: "video",
          message: "Completed successfully!",
          raw: result
        });
      }

      if ((status as any).status === "FAILED") {
        return NextResponse.json({
          error: "Job failed",
          details: (status as any).error || "Unknown error",
          raw: status
        }, { status: 500 });
      }

      // Unknown status
      return NextResponse.json({
        status: (status as any).status,
        message: `Status: ${(status as any).status}`,
        raw: status
      });
    } catch (e:any) {
      const s = e?.response?.status || 502;
      const d = e?.response?.data || { message: String(e?.message||e) };
      console.log("[status][err]", s, d);
      return NextResponse.json({ status:"FAILED", message:"status error", error:d }, { status: 200 });
    }
  } catch (error: any) {
    console.error("Status check error:", error);
    return NextResponse.json({
      error: "Failed to check job status",
      details: error?.message || "Unknown error",
    }, { status: 500 });
  }
}
