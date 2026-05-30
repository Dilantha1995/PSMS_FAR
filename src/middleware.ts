import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE = "far_auth";

async function expectedToken(): Promise<string> {
  const pw = process.env.APP_PASSWORD || "";
  const data = new TextEncoder().encode(pw + "::psms-far");
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // No password configured -> open access (development convenience).
  if (!process.env.APP_PASSWORD) return NextResponse.next();

  // Allow the login page and its action through.
  if (pathname.startsWith("/login")) return NextResponse.next();

  const token = req.cookies.get(AUTH_COOKIE)?.value;
  const expected = await expectedToken();

  if (token === expected) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // Protect everything except Next internals and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|letterhead|.*\\.(?:png|jpg|jpeg|svg|ico)).*)"],
};
