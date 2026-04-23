import { describe, it, expect } from "vitest";

function isTokenExpired(expiry: Date | null): boolean {
  if (!expiry) return true;
  return expiry < new Date();
}

function isValidPassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) return { valid: false, error: "Password must be at least 8 characters" };
  return { valid: true };
}

describe("isTokenExpired", () => {
  it("returns true when expiry is null", () => {
    expect(isTokenExpired(null)).toBe(true);
  });

  it("returns true when expiry is in the past", () => {
    const past = new Date(Date.now() - 1000);
    expect(isTokenExpired(past)).toBe(true);
  });

  it("returns false when expiry is in the future", () => {
    const future = new Date(Date.now() + 60 * 60 * 1000);
    expect(isTokenExpired(future)).toBe(false);
  });
});

describe("isValidPassword", () => {
  it("rejects passwords shorter than 8 characters", () => {
    const result = isValidPassword("short");
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/8 characters/);
  });

  it("accepts passwords of exactly 8 characters", () => {
    expect(isValidPassword("exactly8").valid).toBe(true);
  });

  it("accepts longer passwords", () => {
    expect(isValidPassword("a-longer-secure-password-123").valid).toBe(true);
  });
});
