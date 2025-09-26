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

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/avif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: "Invalid file type. Please upload a JPEG, PNG, WebP, GIF, or AVIF image."
      }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({
        error: "File too large. Please upload an image smaller than 10MB."
      }, { status: 400 });
    }

    // Upload to FAL storage
    const url = await fal.storage.upload(file);

    return NextResponse.json({
      url,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({
      error: "Failed to upload file",
      details: error?.message || "Unknown error"
    }, { status: 500 });
  }
}
