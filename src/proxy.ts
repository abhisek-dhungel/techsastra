import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);

  const isLogin = pathname === "/admin/login";
  const isAdminPage = pathname.startsWith("/admin");
  const isWriteApi =
    (pathname.startsWith("/api/posts") && request.method !== "GET") ||
    (pathname === "/api/posts" && request.method === "GET") ||
    (pathname === "/api/categories" && request.method === "GET") ||
    pathname === "/api/upload";

  // Protect admin UI
  if (isAdminPage) {
    if (isLogin) {
      if (session) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.next();
    }
    if (!session) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Protect CMS APIs used by the admin panel
  if (isWriteApi && !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/api/posts",
    "/api/posts/:path*",
    "/api/categories",
    "/api/upload",
  ],
};
