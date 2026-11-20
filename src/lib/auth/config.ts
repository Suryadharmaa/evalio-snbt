import "server-only";
import { z } from "zod";

const endpoint = z.url().pipe(z.string().refine((value) => {
  const url = new URL(value);
  const local = ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
  return (url.protocol === "https:" || (local && url.protocol === "http:")) &&
    url.pathname === "/" && !url.username && !url.password && !url.search && !url.hash;
}));

const publicConnection = z.object({
  url: endpoint,
  key: z.string().regex(/^sb_publishable_[A-Za-z0-9_-]+$/),
});
const configuration = publicConnection.extend({
  origin: endpoint.transform((value) => new URL(value).origin),
  recoverySecret: z.string().min(32),
});

function publicSupabaseEnvironment() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
}

export function getPublicSupabaseConfig() {
  return publicConnection.safeParse(publicSupabaseEnvironment()).data;
}

export function getAuthConfig() {
  return configuration.safeParse({
    ...publicSupabaseEnvironment(),
    origin: process.env.NEXT_PUBLIC_APP_URL,
    recoverySecret: process.env.EVALIO_RECOVERY_SECRET,
  }).data;
}

export type AuthConfig = NonNullable<ReturnType<typeof getAuthConfig>>;
