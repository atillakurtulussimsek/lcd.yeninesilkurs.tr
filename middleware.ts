import { NextRequest, NextResponse } from "next/server";
import { verifyBasicAuth, parseBasicAuth } from "@/app/services/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow /admin/login to be accessed without authentication
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Protect /admin/* routes and /api/admin/* routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    // Get Authorization header
    const authHeader = request.headers.get("authorization");
    const credentials = parseBasicAuth(authHeader);

    if (!credentials || !verifyBasicAuth(credentials.username, credentials.password)) {
      // Return 401 with WWW-Authenticate header to trigger browser's login dialog
      return new NextResponse(
        JSON.stringify({ error: "Authentication required" }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "WWW-Authenticate": 'Basic realm="Admin Panel"',
          },
        }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
