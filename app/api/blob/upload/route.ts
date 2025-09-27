import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname: string) => {
        // Allow uploads for our supported file types
        return {
          allowedContentTypes: [
            'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif',
            'video/mp4', 'video/webm', 'video/avi', 'video/mov', 'video/mkv', 'video/quicktime',
            'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/flac'
          ],
          maximumSizeInBytes: 1024 * 1024 * 1024, // 1GB limit (supports unlimited lip sync videos)
          addRandomSuffix: true, // Generate unique filenames to avoid conflicts
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // This will be called when upload to Vercel Blob completes
        console.log('Vercel Blob upload completed:', blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
