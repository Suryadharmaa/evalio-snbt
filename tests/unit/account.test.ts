import { describe, expect, test } from "vitest";
import { confirmationSchema, profileSchema, signUpSchema } from "@/features/account/validation";
import { issueRecoveryToken, recoveryLifetimeSeconds, verifyRecoveryToken } from "@/lib/auth/recovery-token";

describe("account form validation", () => {
  const registration = {
    email: "test@example.com",
    password: "synthetic-password",
    cohortYear: "2028",
    acknowledged: "on",
  };

  test("registration requires the notice, a valid email, and a valid target year", () => {
    expect(signUpSchema.parse(registration).cohortYear).toBe(2028);
    expect(signUpSchema.safeParse({ ...registration, acknowledged: undefined }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...registration, email: "test" }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...registration, cohortYear: "2e3" }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...registration, password: "a".repeat(73) }).success).toBe(false);
  });

  test("only editable profile fields survive validation", () => {
    expect(profileSchema.parse({
      alias: "  Uji ",
      cohortYear: "2027",
      studyGoal: " ",
      user_id: "another-id",
      role: "admin",
      delete_requested_at: "2026-11-20",
    })).toEqual({ alias: "Uji", cohortYear: 2027, studyGoal: null });
    expect(profileSchema.safeParse({ ...registration, alias: "a".repeat(61) }).success).toBe(false);
  });

  test("confirmation accepts only a single supported email token and purpose", () => {
    const token_hash = "pkce_" + "a".repeat(56);
    expect(confirmationSchema.safeParse({ token_hash, type: "recovery" }).success).toBe(true);
    expect(confirmationSchema.safeParse({ token_hash: [token_hash], type: "email" }).success).toBe(false);
    expect(confirmationSchema.safeParse({ token_hash, type: "magiclink" }).success).toBe(false);
    expect(confirmationSchema.safeParse({ token_hash: "a b".repeat(20), type: "email" }).success).toBe(false);
  });
});

test("recovery grants expire and are tied to a verified session and issuing secret", () => {
  const secret = "synthetic-recovery-key";
  const now = Date.UTC(2026, 10, 20);
  const token = issueRecoveryToken(secret, "session-a", now);
  expect(verifyRecoveryToken(token, secret, "session-a", now)).toBe(true);
  expect(verifyRecoveryToken(token, secret, "session-b", now)).toBe(false);
  expect(verifyRecoveryToken(token, "other-secret", "session-a", now)).toBe(false);
  expect(verifyRecoveryToken(token.replace(/.$/, "g"), secret, "session-a", now)).toBe(false);
  expect(verifyRecoveryToken(token, secret, "session-a", now + recoveryLifetimeSeconds * 1000)).toBe(false);
});
