import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, readFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { LocalStorageDriver, S3StorageDriver, resetStorageDriver } from "@/lib/storage";

describe("LocalStorageDriver", () => {
  let tmpDir: string;
  let driver: LocalStorageDriver;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "carbon-storage-test-"));
    driver = new LocalStorageDriver(tmpDir, "https://example.com");
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("upload writes file and returns public URL", async () => {
    const buffer = Buffer.from("hello world");
    const url = await driver.upload("uploads/test.txt", buffer, "text/plain");

    expect(url).toBe("https://example.com/uploads/test.txt");
    const written = await readFile(join(tmpDir, "uploads", "test.txt"), "utf-8");
    expect(written).toBe("hello world");
  });

  it("upload creates intermediate directories", async () => {
    const buffer = Buffer.from("nested");
    await driver.upload("uploads/2024/01/image.jpg", buffer, "image/jpeg");

    const written = await readFile(join(tmpDir, "uploads", "2024", "01", "image.jpg"));
    expect(written.toString()).toBe("nested");
  });

  it("upload strips trailing slash from publicUrl", async () => {
    const d = new LocalStorageDriver(tmpDir, "https://example.com/");
    const url = await d.upload("uploads/file.txt", Buffer.from("x"), "text/plain");
    expect(url).toBe("https://example.com/uploads/file.txt");
  });

  it("delete removes an existing file", async () => {
    await driver.upload("uploads/to-delete.txt", Buffer.from("bye"), "text/plain");
    await driver.delete("uploads/to-delete.txt");
    await expect(readFile(join(tmpDir, "uploads", "to-delete.txt"))).rejects.toThrow();
  });

  it("delete is silent for a non-existent file", async () => {
    await expect(driver.delete("uploads/ghost.txt")).resolves.not.toThrow();
  });

  it("keyFromUrl strips the public URL prefix", () => {
    expect(driver.keyFromUrl("https://example.com/uploads/test.txt")).toBe("uploads/test.txt");
  });

  it("keyFromUrl handles nested paths", () => {
    expect(driver.keyFromUrl("https://example.com/uploads/2024/01/image.jpg")).toBe(
      "uploads/2024/01/image.jpg",
    );
  });
});

describe("S3StorageDriver", () => {
  it("keyFromUrl strips the S3 bucket URL prefix", () => {
    const driver = new S3StorageDriver(
      "my-bucket",
      "us-east-1",
      "AKID",
      "secret",
    );
    expect(driver.keyFromUrl("https://my-bucket.s3.us-east-1.amazonaws.com/uploads/img.jpg")).toBe(
      "uploads/img.jpg",
    );
  });

  it("keyFromUrl uses custom CDN URL when provided", () => {
    const driver = new S3StorageDriver(
      "my-bucket",
      "us-east-1",
      "AKID",
      "secret",
      "https://media.example.com",
    );
    expect(driver.keyFromUrl("https://media.example.com/uploads/img.jpg")).toBe("uploads/img.jpg");
  });

  it("keyFromUrl strips trailing slash from custom CDN URL", () => {
    const driver = new S3StorageDriver(
      "my-bucket",
      "us-east-1",
      "AKID",
      "secret",
      "https://media.example.com/",
    );
    expect(driver.keyFromUrl("https://media.example.com/uploads/img.jpg")).toBe("uploads/img.jpg");
  });
});

describe("resetStorageDriver", () => {
  it("does not throw", () => {
    expect(() => resetStorageDriver()).not.toThrow();
  });
});
