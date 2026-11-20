import "server-only";
import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getAuthConfig, type AuthConfig } from "./config";
import type { Database } from "./database";

export function sessionCookieName(recovery: boolean) {
  return recovery ? "evalio-recovery-session" : "evalio-session";
}

export function sessionCookieOptions(config: AuthConfig, recovery: boolean) {
  return {
    path: recovery ? "/reset-password" : "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: config.origin.startsWith("https:"),
  };
}

export function createSessionClient(
  config: AuthConfig,
  recovery: boolean,
  cookieMethods: CookieMethodsServer,
) {
  return createServerClient<Database>(config.url, config.key, {
    cookies: cookieMethods,
    cookieOptions: { name: sessionCookieName(recovery), ...sessionCookieOptions(config, recovery) },
  });
}

export async function createAccountClient({
  recovery = false,
  writable = false,
} = {}) {
  const config = getAuthConfig();
  if (!config) return null;

  const jar = await cookies();
  return createSessionClient(config, recovery, {
    getAll: () => jar.getAll(),
    setAll(entries) {
      // Server Components receive refreshed cookies through proxy.ts.
      if (!writable) return;
      for (const { name, value, options } of entries) jar.set(name, value, options);
    },
  });
}
