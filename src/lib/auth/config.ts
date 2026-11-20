import "server-only";
import { z } from "zod";

const endpoint = z.url().pipe(z.string().refine((value) => {
  const url = new URL(value);
  const local = ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
  return (url.protocol === "https:" || (local && url.protocol === "http:")) &&
    url.pathname === "/" && !url.username && !url.password && !url.search && !url.hash;
}));

const configuration = z.object({
  url: endpoint,
  origin: endpoint.transform((value) => new URL(value).origin),
  key: z.string().regex(/^sb_publishable_[A-Za-z0-9_-]+$/),
  recoverySecret: z.string().min(32),
});

export function getAuthConfig() {
  return configuration.safeParse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    origin: process.env.NEXT_PUBLIC_APP_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    recoverySecret: process.env.EVALIO_RECOVERY_SECRET,
  }).data;
}

export type AuthConfig = NonNullable<ReturnType<typeof getAuthConfig>>;
