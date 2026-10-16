import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = ["/chat", "/knowledge", "/usage"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const needsAuth = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (!needsAuth) return NextResponse.next();

  const hasSession = request.cookies
    .getAll()
    .some((cookie) => cookie.name.includes("session_token") || cookie.name.includes("session-token"));

  if (hasSession) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/sign-in";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/chat", "/chat/:path*", "/knowledge", "/knowledge/:path*", "/usage", "/usage/:path*"],
};
