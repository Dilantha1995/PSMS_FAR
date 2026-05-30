"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, USER_COOKIE, ROLE_COOKIE, authToken, authenticate } from "@/lib/auth";

export async function login(formData: FormData) {
  const username = String(formData.get("name") || "").trim();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/") || "/";

  const res = await authenticate(username, password);
  if (!res.ok) {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }

  const c = cookies();
  const opts = {
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
  c.set(AUTH_COOKIE, authToken(), { httpOnly: true, ...opts });
  c.set(USER_COOKIE, encodeURIComponent(res.name), opts);
  c.set(ROLE_COOKIE, res.role, opts);
  redirect(next.startsWith("/") ? next : "/");
}
