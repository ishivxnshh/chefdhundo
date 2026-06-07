import { describe, expect, it } from "vitest";
import {
  authCookieOptions,
  hashRequestIp,
  normalizeIndianPhone,
  phoneToSyntheticId,
  syntheticIdToPhone,
} from "./core";

describe("normalizeIndianPhone", () => {
  it("normalizes supported Indian mobile formats", () => {
    expect(normalizeIndianPhone("98765 43210")).toBe("+919876543210");
    expect(normalizeIndianPhone("919876543210")).toBe("+919876543210");
    expect(normalizeIndianPhone("+91-98765-43210")).toBe("+919876543210");
  });

  it("rejects non-mobile and non-Indian values", () => {
    expect(normalizeIndianPhone("12345")).toBeNull();
    expect(normalizeIndianPhone("+14155552671")).toBeNull();
  });
});

describe("mobile identity", () => {
  it("round trips a normalized phone identity", () => {
    const phone = "+919876543210";
    expect(syntheticIdToPhone(phoneToSyntheticId(phone))).toBe(phone);
  });
});

describe("hashRequestIp", () => {
  it("returns a stable digest without exposing the original IP", () => {
    const hash = hashRequestIp("203.0.113.10", "secret");
    expect(hash).toBe(hashRequestIp("203.0.113.10", "secret"));
    expect(hash).not.toContain("203.0.113.10");
    expect(hash).toHaveLength(64);
  });
});

describe("authCookieOptions", () => {
  it("uses matching secure production cookie settings", () => {
    expect(authCookieOptions(true)).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    });
    expect(authCookieOptions(false).secure).toBe(false);
  });
});
