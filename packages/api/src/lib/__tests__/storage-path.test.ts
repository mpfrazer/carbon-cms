import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, chmod } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { validateMediaPath, testMediaPathWritable } from "@/lib/storage-path";

describe("validateMediaPath", () => {
  it("returns error for empty string", () => {
    expect(validateMediaPath("")).not.toBeNull();
  });

  it("returns error for whitespace-only string", () => {
    expect(validateMediaPath("   ")).not.toBeNull();
  });

  it("returns error for relative path", () => {
    expect(validateMediaPath("media/uploads")).not.toBeNull();
  });

  it("returns error for dot-relative path", () => {
    expect(validateMediaPath("./media")).not.toBeNull();
  });

  it("returns error for path containing null byte", () => {
    expect(validateMediaPath("/var/media\0evil")).not.toBeNull();
  });

  it("returns null for a valid absolute path", () => {
    expect(validateMediaPath("/var/carbon/media")).toBeNull();
  });

  it("returns null for a deeply nested absolute path", () => {
    expect(validateMediaPath("/srv/app/data/uploads/media")).toBeNull();
  });
});

describe("testMediaPathWritable", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "carbon-path-test-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("returns null for a writable directory", async () => {
    const result = await testMediaPathWritable(tmpDir);
    expect(result).toBeNull();
  });

  it("creates the directory if it does not exist", async () => {
    const newDir = join(tmpDir, "nested", "path");
    const result = await testMediaPathWritable(newDir);
    expect(result).toBeNull();
  });

  it("returns an error string for an unwritable path", async () => {
    const lockedDir = await mkdtemp(join(tmpdir(), "carbon-locked-"));
    await chmod(lockedDir, 0o444);
    try {
      const result = await testMediaPathWritable(join(lockedDir, "sub"));
      expect(result).not.toBeNull();
      expect(typeof result).toBe("string");
    } finally {
      await chmod(lockedDir, 0o755);
      await rm(lockedDir, { recursive: true, force: true });
    }
  });
});
