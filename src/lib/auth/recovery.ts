import "server-only";
import { cookies } from "next/headers";
import { createAccountClient, sessionCookieName, sessionCookieOptions } from "./client";
import { getAuthConfig } from "./config";
import { issueRecoveryToken, recoveryLifetimeSeconds, verifyRecoveryToken } from "./recovery-token";

const grantCookie = "evalio-recovery-grant";

type RecoveryClient = NonNullable<Awaited<ReturnType<typeof createAccountClient>>>;

async function verifiedSessionId(client: RecoveryClient) {
  const { data, error } = await client.auth.getClaims();
  const sessionId = data?.claims.session_id;
  return !error && typeof sessionId === "string" ? sessionId : null;
}

export async function grantPasswordRecovery(client: RecoveryClient) {
  const config = getAuthConfig();
  const sessionId = await verifiedSessionId(client);
  if (!config || !sessionId) return false;

  const jar = await cookies();
  jar.set(grantCookie, issueRecoveryToken(config.recoverySecret, sessionId), {
    ...sessionCookieOptions(config, true),
    maxAge: recoveryLifetimeSeconds,
  });
  return true;
}

export async function getRecoveryClient(writable = false) {
  const config = getAuthConfig();
  const jar = await cookies();
  const grant = jar.get(grantCookie)?.value;
  if (!config || !grant) return null;

  const client = await createAccountClient({ recovery: true, writable });
  if (!client) return null;
  const sessionId = await verifiedSessionId(client);
  if (!sessionId || !verifyRecoveryToken(grant, config.recoverySecret, sessionId)) return null;
  const { data, error } = await client.auth.getUser();
  return !error && data.user ? client : null;
}

export async function clearPasswordRecovery() {
  const config = getAuthConfig();
  if (!config) return;
  const jar = await cookies();
  const namePrefix = sessionCookieName(true);
  const options = sessionCookieOptions(config, true);
  // Expire the grant and any chunked recovery session even if provider logout fails.
  for (const { name } of jar.getAll()) {
    if (name === grantCookie || name === namePrefix || name.startsWith(`${namePrefix}.`)) {
      jar.set(name, "", { ...options, maxAge: 0 });
    }
  }
}
