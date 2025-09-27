import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";

// Configure FAL client
fal.config({
  credentials: process.env.FAL_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const blobUrl = formData.get("blobUrl") as string;

    let fileUrl: string;
    let fileToProcess: File;

    if (blobUrl) {
      // File was uploaded to Vercel Blob, download it
      try {
        const response = await fetch(blobUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch from Vercel Blob: ${response.status}`);
        }
        const blob = await response.blob();

        // Validate file type from blob
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/avif"];
        if (!allowedTypes.includes(blob.type)) {
          return NextResponse.json({
            error: "Invalid file type. Please upload a JPEG, PNG, WebP, GIF, or AVIF image."
          }, { status: 400 });
        }

        // Create a File from the blob for FAL upload
        fileToProcess = new File([blob], "uploaded-image.jpg", { type: blob.type });
      } catch (error) {
        console.error("Error processing Vercel Blob URL:", error);
        return NextResponse.json({
          error: "Failed to process uploaded file",
          details: (error as Error).message
        }, { status: 500 });
      }
    } else if (file) {
      // Direct file upload (for small files)
      fileToProcess = file;
    } else {
      return NextResponse.json({ error: "No file or blobUrl provided" }, { status: 400 });
    }

    // Validate file size - allow 20MB for MiniMax, 10MB for others
    const isMiniMaxRequest = req.headers.get('x-model-id') === 'fal-ai/minimax/hailuo-02/pro/image-to-video';
    const maxSize = isMiniMaxRequest ? 20 * 1024 * 1024 : 10 * 1024 * 1024;
    if (fileToProcess.size > maxSize) {
      return NextResponse.json({
        error: `File too large. Please upload an image smaller than ${isMiniMaxRequest ? '20MB' : '10MB'}.`
      }, { status: 400 });
    }

    // Upload to FAL storage
    fileUrl = await fal.storage.upload(fileToProcess);

    return NextResponse.json({
      url: fileUrl,
      fileName: fileToProcess.name,
      fileSize: fileToProcess.size,
      fileType: fileToProcess.type
    });

  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({
      error: "Failed to upload file",
      details: error?.message || "Unknown error"
    }, { status: 500 });
  }
}
