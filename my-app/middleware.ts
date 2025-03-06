import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const pathname = request.nextUrl.pathname;

  // If it's an API request, rewrite to the backend
  if (pathname.startsWith("/api/")) {
    const url = new URL(pathname, "https://text2sql-backend.onrender.com");
    return NextResponse.rewrite(url);
  }

  // For all other routes, continue to Next.js handling
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all API routes
    "/api/:path*",
    // Match all page routes
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
