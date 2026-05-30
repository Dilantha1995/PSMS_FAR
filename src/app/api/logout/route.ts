import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE, USER_COOKIE } from "@/lib/auth";

export async function POST(req: Request) {
  const c = cookies();
  c.delete(AUTH_COOKIE);
  c.delete(USER_COOKIE);
  return NextResponse.redirect(new URL("/login", req.url));
}
