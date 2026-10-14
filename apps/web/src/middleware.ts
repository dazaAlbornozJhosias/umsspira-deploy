import { NextResponse, type NextRequest } from "next/server";
import {
  decideAccess,
  ROLE_COOKIE,
  TOKEN_COOKIE,
} from "./modules/auth/frontend/services/route-access";

export function middleware(request: NextRequest) {
  const decision = decideAccess(
    request.nextUrl.pathname,
    request.cookies.get(TOKEN_COOKIE)?.value,
    request.cookies.get(ROLE_COOKIE)?.value,
  );

  if (!decision.allowed) {
    return NextResponse.redirect(new URL(decision.redirectTo, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/applications/:path*", "/me/:path*"],
};