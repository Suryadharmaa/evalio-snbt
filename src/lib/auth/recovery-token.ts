import { createHmac, timingSafeEqual } from "node:crypto";

export const recoveryLifetimeSeconds = 15 * 60;

function digest(secret: string, sessionId: string, expires: number) {
  return createHmac("sha256", secret).update(`evalio-password-recovery:${sessionId}:${expires}`).digest();
}

export function issueRecoveryToken(secret: string, sessionId: string, now = Date.now()) {
  const expires = Math.floor(now / 1000) + recoveryLifetimeSeconds;
  return `${expires}.${digest(secret, sessionId, expires).toString("hex")}`;
}

export function verifyRecoveryToken(
  token: string,
  secret: string,
  sessionId: string,
  now = Date.now(),
) {
  const match = /^(\d{1,12})\.([a-f0-9]{64})$/.exec(token);
  if (!match) return false;

  const expires = Number(match[1]);
  const remaining = expires - Math.floor(now / 1000);
  return remaining > 0 && remaining <= recoveryLifetimeSeconds &&
    timingSafeEqual(Buffer.from(match[2], "hex"), digest(secret, sessionId, expires));
}
