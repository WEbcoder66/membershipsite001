import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const runtime = 'nodejs';

const bucketName = 'my-site-uploads'; // Replace with your DO Spaces bucket name
const region = process.env.DO_REGION!;
const endpoint = process.env.DO_SPACES_ENDPOINT!;

export async function POST(req: Request) {
  try {
    const { fileName, fileType } = await req.json();

    // Configure S3 client for DO Spaces
    const s3 = new S3Client({
      region,
      credentials: {
        accessKeyId: process.env.DO_ACCESS_KEY_ID!,
        secretAccessKey: process.env.DO_SECRET_ACCESS_KEY!
      },
      endpoint, 
      forcePathStyle: false
    });

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      ContentType: fileType
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 }); // URL valid for 1 hour
    return NextResponse.json({ url: signedUrl });
  } catch (error: any) {
    console.error('Error getting pre-signed URL:', error);
    return NextResponse.json({ error: 'Failed to generate pre-signed URL' }, { status: 500 });
  }
}
