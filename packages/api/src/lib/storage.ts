import path from "path";
import fs from "fs/promises";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

export interface StorageDriver {
  upload(key: string, buffer: Buffer, mimeType: string): Promise<string>;
  delete(key: string): Promise<void>;
  keyFromUrl(url: string): string;
}

// ─── Local driver ────────────────────────────────────────────────────────────

export class LocalStorageDriver implements StorageDriver {
  constructor(
    readonly mediaDir: string,
    private readonly publicUrl: string,
  ) {
    this.publicUrl = publicUrl.replace(/\/$/, "");
  }

  async upload(key: string, buffer: Buffer, _mimeType: string): Promise<string> {
    const filepath = path.join(this.mediaDir, key);
    await fs.mkdir(path.dirname(filepath), { recursive: true });
    await fs.writeFile(filepath, buffer);
    return `${this.publicUrl}/${key}`;
  }

  async delete(key: string): Promise<void> {
    await fs.unlink(path.join(this.mediaDir, key)).catch(() => {});
  }

  keyFromUrl(url: string): string {
    return url.replace(`${this.publicUrl}/`, "");
  }
}

// ─── S3 driver ───────────────────────────────────────────────────────────────

export class S3StorageDriver implements StorageDriver {
  private readonly s3: S3Client;
  private readonly urlBase: string;

  constructor(
    private readonly bucket: string,
    region: string,
    accessKeyId: string,
    secretAccessKey: string,
    urlBase?: string,
  ) {
    this.s3 = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });
    this.urlBase = (urlBase ?? `https://${bucket}.s3.${region}.amazonaws.com`).replace(/\/$/, "");
  }

  async upload(key: string, buffer: Buffer, mimeType: string): Promise<string> {
    await this.s3.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: buffer, ContentType: mimeType }),
    );
    return `${this.urlBase}/${key}`;
  }

  async delete(key: string): Promise<void> {
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  keyFromUrl(url: string): string {
    return url.replace(`${this.urlBase}/`, "");
  }
}

// ─── Driver selection ─────────────────────────────────────────────────────────

export const STORAGE_SETTING_KEYS = [
  "storageDriver",
  "mediaDir",
  "awsS3Bucket",
  "awsRegion",
  "awsAccessKeyId",
  "awsSecretAccessKey",
  "awsS3UrlBase",
] as const;

async function initDriver(): Promise<StorageDriver> {
  const { db } = await import("@/lib/db");
  const { settings } = await import("@/lib/db/schema");
  const { inArray } = await import("drizzle-orm");

  const rows = await db
    .select()
    .from(settings)
    .where(inArray(settings.key, [...STORAGE_SETTING_KEYS]));

  const cfg: Record<string, string> = Object.fromEntries(
    rows.map((r) => {
      try {
        return [r.key, JSON.parse(r.value)];
      } catch {
        return [r.key, r.value];
      }
    }),
  );

  const driver = cfg.storageDriver ?? process.env.STORAGE_DRIVER ?? "local";

  if (driver === "s3") {
    const bucket = cfg.awsS3Bucket ?? process.env.AWS_S3_BUCKET ?? "";
    const region = cfg.awsRegion ?? process.env.AWS_REGION ?? "";
    const accessKeyId = cfg.awsAccessKeyId ?? process.env.AWS_ACCESS_KEY_ID ?? "";
    const secretAccessKey = cfg.awsSecretAccessKey ?? process.env.AWS_SECRET_ACCESS_KEY ?? "";
    const urlBase = cfg.awsS3UrlBase ?? process.env.AWS_S3_URL_BASE;
    return new S3StorageDriver(bucket, region, accessKeyId, secretAccessKey, urlBase);
  }

  const mediaDir = cfg.mediaDir ?? process.env.MEDIA_DIR ?? path.join(process.cwd(), ".media");
  // CARBON_PUBLIC_URL is the URL at which this API's /uploads route is reachable.
  // Do NOT use siteUrl here — that's the frontend URL; only the API serves /uploads.
  const publicUrl = process.env.CARBON_PUBLIC_URL ?? "http://localhost:3001";
  return new LocalStorageDriver(mediaDir, publicUrl);
}

let _driver: StorageDriver | null = null;
let _pending: Promise<StorageDriver> | null = null;

export function getStorageDriver(): Promise<StorageDriver> {
  if (_driver) return Promise.resolve(_driver);
  if (_pending) return _pending;
  _pending = initDriver().then((d) => {
    _driver = d;
    _pending = null;
    return d;
  });
  return _pending;
}

export function resetStorageDriver(): void {
  _driver = null;
  _pending = null;
}

// ─── Shims ───────────────────────────────────────────────────────────────────

export async function uploadFile(key: string, buffer: Buffer, mimeType: string): Promise<string> {
  return (await getStorageDriver()).upload(key, buffer, mimeType);
}

export async function deleteFile(key: string): Promise<void> {
  return (await getStorageDriver()).delete(key);
}

export async function keyFromUrl(url: string): Promise<string> {
  return (await getStorageDriver()).keyFromUrl(url);
}
