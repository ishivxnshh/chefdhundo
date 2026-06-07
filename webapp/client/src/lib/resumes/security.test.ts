import { describe, expect, it } from "vitest";
import {
  canClaimResumeForPhone,
  hashClaimToken,
  serializeResumeForViewer,
  verifyWhatsappIngestionSecret,
} from "./security";

const resume = {
  id: "resume-1",
  user_id: "user-1",
  name: "Chef Test",
  phone: "+919876543210",
  passport: "P1234567",
  claim_token: "secret-token",
  resume_file: "https://storage.example/private.pdf",
  email: "legacy@example.com",
  profession: "Chef",
  city: "Metro Cities",
};

describe("serializeResumeForViewer", () => {
  it("never exposes private resume fields to a basic viewer", () => {
    const result = serializeResumeForViewer(resume, {
      role: "basic",
      userId: "other-user",
    });

    expect(result.phone).toBe("+91******3210");
    expect(result).not.toHaveProperty("passport");
    expect(result).not.toHaveProperty("claim_token");
    expect(result).not.toHaveProperty("resume_file");
    expect(result).not.toHaveProperty("email");
    expect(result).not.toHaveProperty("user_id");
  });

  it("allows contact fields for pro viewers without exposing private fields", () => {
    const result = serializeResumeForViewer(resume, {
      role: "pro",
      userId: "other-user",
    });

    expect(result.phone).toBe("+919876543210");
    expect(result).not.toHaveProperty("passport");
    expect(result).not.toHaveProperty("claim_token");
    expect(result).not.toHaveProperty("resume_file");
  });

  it("allows private fields only for the owner or an admin", () => {
    const owner = serializeResumeForViewer(resume, {
      role: "basic",
      userId: "user-1",
    });
    const admin = serializeResumeForViewer(resume, {
      role: "admin",
      userId: "other-user",
    });

    expect(owner.passport).toBe("P1234567");
    expect(admin.passport).toBe("P1234567");
    expect(owner).not.toHaveProperty("claim_token");
    expect(admin).not.toHaveProperty("claim_token");
  });
});

describe("canClaimResumeForPhone", () => {
  it("requires the signed-in phone to match the resume phone", () => {
    expect(canClaimResumeForPhone("+919876543210", "+919876543210")).toBe(true);
    expect(canClaimResumeForPhone("+919999999999", "+919876543210")).toBe(false);
  });
});

describe("hashClaimToken", () => {
  it("creates a stable non-reversible token digest", () => {
    const digest = hashClaimToken("claim-secret");

    expect(digest).toBe(hashClaimToken("claim-secret"));
    expect(digest).not.toContain("claim-secret");
    expect(digest).toHaveLength(64);
  });
});

describe("verifyWhatsappIngestionSecret", () => {
  it("fails closed when the configured secret is missing or mismatched", () => {
    expect(verifyWhatsappIngestionSecret("provided", undefined)).toBe(false);
    expect(verifyWhatsappIngestionSecret("wrong", "configured")).toBe(false);
    expect(verifyWhatsappIngestionSecret("configured", "configured")).toBe(true);
  });
});
