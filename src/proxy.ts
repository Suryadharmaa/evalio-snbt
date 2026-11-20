import { NextResponse, type NextRequest } from "next/server";
import { createSessionClient } from "@/lib/auth/client";
import { getAuthConfig } from "@/lib/auth/config";

export async function proxy(request: NextRequest) {
  const configuration = getAuthConfig();
  const pathname = request.nextUrl.pathname;
  let response = NextResponse.next({ request });

  if (configuration && (pathname === "/reset-password" ||
    pathname === "/dashboard" || pathname.startsWith("/dashboard/") ||
    pathname === "/profile" || pathname.startsWith("/profile/") ||
    pathname === "/admin/questions" || pathname.startsWith("/admin/questions/") ||
    pathname.startsWith("/api/v1/questions/"))) {
    const supabase = createSessionClient(configuration, pathname === "/reset-password", {
      getAll: () => request.cookies.getAll(),
      setAll(entries, headers) {
        for (const { name, value } of entries) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of entries) response.cookies.set(name, value, options);
        for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
      },
    });
    await supabase.auth.getClaims();
  }

  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

export const config = {
  matcher: [
    "/sign-in",
    "/sign-up",
    "/forgot-password",
    "/reset-password",
    "/auth/confirm",
    "/dashboard/:path*",
    "/profile/:path*",
    "/admin/questions/:path*",
    "/api/v1/questions/:path*",
  ],
};
