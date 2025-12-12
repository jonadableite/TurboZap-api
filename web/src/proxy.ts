import { NextRequest, NextResponse } from "next/server";

// Routes that don't require authentication (public)
const publicRoutes = [
  "/",           // Landing page (marketing)
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/docs",
  "/api/auth",
];

// Routes that require authentication (protected)
const protectedRoutes = ["/app", "/app/instances", "/app/settings"];

// Routes that require specific roles
const adminRoutes = ["/app/admin"];

const developerRoutes = ["/app/api-keys", "/app/logs"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip proxy for static files and internal assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/landing") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check if it's a public route - exact match for "/" and prefix match for others
  const isPublicRoute = publicRoutes.some((route) => {
    if (route === "/") {
      return pathname === "/" || pathname === "";
    }
    return pathname === route || pathname.startsWith(`${route}/`);
  });

  // Get session from cookie
  // Better Auth em produção usa prefixo __Secure-
  const sessionCookie =
    request.cookies.get("__Secure-turbozap.session_token")?.value ||
    request.cookies.get("turbozap.session_token")?.value;

  // If no session and trying to access protected route (/app/*), redirect to sign-in
  if (!sessionCookie && !isPublicRoute && pathname.startsWith("/app")) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // If has session and trying to access auth pages, redirect to app dashboard
  if (sessionCookie && (pathname === "/sign-in" || pathname === "/sign-up")) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  // For role-based routes, add a header flag for server-side verification
  if (sessionCookie && pathname.startsWith("/app")) {
    const isAdminRoute = adminRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );
    const isDeveloperRoute = developerRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );

    if (isAdminRoute || isDeveloperRoute) {
      const response = NextResponse.next();
      response.headers.set(
        "x-requires-role",
        isAdminRoute ? "ADMIN" : "DEVELOPER"
      );
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json)$).*)",
  ],
};
