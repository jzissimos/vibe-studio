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

    if (!requestId) {
      return NextResponse.json({ error: "Missing request_id parameter" }, { status: 400 });
    }

    console.log("Checking status for request:", requestId);

    // Check the status of the queued job
    const status = await fal.queue.status("fal-ai/sync-lipsync/v2/pro", {
      requestId: requestId,
    });

    console.log("Job status:", status.status);

    if (status.status === "IN_PROGRESS" || status.status === "IN_QUEUE") {
      return NextResponse.json({
        status: status.status,
        message: status.status === "IN_QUEUE" ? "Job queued..." : "Processing...",
        progress: status,
      });
    }

    if (status.status === "COMPLETE") {
      // Extract the media URL from the result
      const mediaUrl = status.data?.video?.url || status.data?.output?.[0]?.url;

      if (!mediaUrl) {
        console.error("No media URL found in completed job:", status);
        return NextResponse.json({
          error: "Job completed but no media URL found",
          raw: status
        }, { status: 502 });
      }

      return NextResponse.json({
        request_id: requestId,
        status: "COMPLETE",
        media_url: mediaUrl,
        media_type: "video",
        message: "Lip sync completed successfully!",
        raw: status
      });
    }

    if (status.status === "FAILED") {
      return NextResponse.json({
        error: "Lip sync job failed",
        details: status.error || "Unknown error",
        raw: status
      }, { status: 500 });
    }

    // Unknown status
    return NextResponse.json({
      status: status.status,
      message: `Status: ${status.status}`,
      raw: status
    });

  } catch (error: any) {
    console.error("Status check error:", error);
    return NextResponse.json({
      error: "Failed to check job status",
      details: error?.message || "Unknown error",
    }, { status: 500 });
  }
}
