import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// In-memory storage for demonstration. For large files or production, consider a more scalable solution.
const uploadBuffers: Record<string, Uint8Array[]> = {};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const guid = formData.get('guid') as string;
    const chunkIndexStr = formData.get('chunkIndex') as string;
    const isLastChunkStr = formData.get('isLastChunk') as string;

    if (!file || !guid || !chunkIndexStr || !isLastChunkStr) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const chunkIndex = parseInt(chunkIndexStr, 10);
    const isLastChunk = isLastChunkStr === 'true';

    const arrayBuffer = await file.arrayBuffer();
    const chunkArray = new Uint8Array(arrayBuffer);

    if (!uploadBuffers[guid]) {
      uploadBuffers[guid] = [];
    }

    // Store this chunk at the appropriate index
    uploadBuffers[guid][chunkIndex] = chunkArray;

    if (isLastChunk) {
      // All chunks are now received, concatenate them
      const chunks = uploadBuffers[guid];
      if (!chunks || chunks.length === 0) {
        throw new Error('No chunks found for this guid');
      }

      // Concatenate all chunks into one buffer
      let totalSize = 0;
      for (const c of chunks) totalSize += c.length;
      const fullBuffer = new Uint8Array(totalSize);
      let offset = 0;
      for (const c of chunks) {
        fullBuffer.set(c, offset);
        offset += c.length;
      }

      // Upload the full file to Bunny.net
      const uploadUrl = `https://video.bunnycdn.com/library/${process.env.BUNNY_LIBRARY_ID}/videos/${guid}`;
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'AccessKey': process.env.BUNNY_API_KEY!,
          'Content-Type': 'application/octet-stream'
        },
        body: fullBuffer
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Bunny upload error:', errorText);
        throw new Error(`Failed to upload video to Bunny.net: ${response.statusText}`);
      }

      // Clean up memory
      delete uploadBuffers[guid];

      return NextResponse.json({ success: true, message: 'Video uploaded successfully' });
    } else {
      // Still expecting more chunks
      return NextResponse.json({ success: true, message: `Chunk ${chunkIndex} received` });
    }
  } catch (error: any) {
    console.error('Upload proxy error:', error);
    return NextResponse.json({ error: 'Failed to upload video' }, { status: 500 });
  }
}
