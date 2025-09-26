import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { put } from '@vercel/blob';

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

    if (blobUrl) {
      // File was uploaded to Vercel Blob, now upload to FAL
      try {
        const response = await fetch(blobUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch from Vercel Blob: ${response.status}`);
        }
        const blob = await response.blob();
        const falFile = new File([blob], "uploaded-image.jpg", { type: blob.type });
        fileUrl = await fal.storage.upload(falFile);

        // Optionally clean up the Vercel Blob file
        // await del(blobUrl); // Uncomment if you want to delete from Vercel Blob
      } catch (error) {
        console.error("Error processing Vercel Blob URL:", error);
        return NextResponse.json({
          error: "Failed to process uploaded file",
          details: (error as Error).message
        }, { status: 500 });
      }
    } else if (file) {
      // Direct file upload (for small files or when Vercel Blob isn't used)
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/avif"];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({
          error: "Invalid file type. Please upload a JPEG, PNG, WebP, GIF, or AVIF image."
        }, { status: 400 });
      }

      // Validate file size - allow 20MB for MiniMax, 10MB for others
      const isMiniMaxRequest = req.headers.get('x-model-id') === 'fal-ai/minimax/hailuo-02/pro/image-to-video';
      const maxSize = isMiniMaxRequest ? 20 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        return NextResponse.json({
          error: `File too large. Please upload an image smaller than ${isMiniMaxRequest ? '20MB' : '10MB'}.`
        }, { status: 400 });
      }

      // Upload to FAL storage
      fileUrl = await fal.storage.upload(file);
    } else {
      return NextResponse.json({ error: "No file or blobUrl provided" }, { status: 400 });
    }

    return NextResponse.json({
      url: fileUrl,
      fileName: file?.name || "uploaded-image.jpg",
      fileSize: file?.size || 0,
      fileType: file?.type || "image/jpeg"
    });

  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({
      error: "Failed to upload file",
      details: error?.message || "Unknown error"
    }, { status: 500 });
  }
}
