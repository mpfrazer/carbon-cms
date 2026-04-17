import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const bucket = process.env.AWS_S3_BUCKET!;
// Public base URL for objects, e.g. https://my-bucket.s3.us-east-1.amazonaws.com
// or a CloudFront distribution URL. Trailing slash optional.
const urlBase = (process.env.AWS_S3_URL_BASE ?? `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com`).replace(/\/$/, "");

export async function uploadFile(key: string, buffer: Buffer, mimeType: string): Promise<string> {
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  }));
  return `${urlBase}/${key}`;
}

export async function deleteFile(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export function keyFromUrl(url: string): string {
  return url.replace(`${urlBase}/`, "");
}
