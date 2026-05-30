import { cookies } from "next/headers";
import { createHash } from "crypto";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const AUTH_COOKIE = "far_auth";
export const USER_COOKIE = "far_user";
export const ROLE_COOKIE = "far_role";

const SALT = "::psms-far";

export function authToken(): string {
  const pw = process.env.APP_PASSWORD || "";
  return createHash("sha256").update(pw + SALT).digest("hex");
}

export function hashPassword(pw: string): string {
  return createHash("sha256").update(pw + SALT + "-user").digest("hex");
}

export function passwordRequired(): boolean {
  return !!process.env.APP_PASSWORD;
}

export function isMasterPassword(input: string): boolean {
  const pw = process.env.APP_PASSWORD || "";
  if (!pw) return true; // no password configured -> open (dev)
  return input === pw;
}

export interface AuthResult {
  ok: boolean;
  name: string;
  role: string;
}

/** Validate a login: master password (admin) or a matching active user. */
export async function authenticate(username: string, password: string): Promise<AuthResult> {
  // Master/bootstrap password — always works, full admin.
  if (isMasterPassword(password)) {
    return { ok: true, name: username || "Admin", role: "ADMIN" };
  }
  try {
    const [u] = await db.select().from(users).where(eq(users.username, username.toLowerCase()));
    if (u && u.active && u.passwordHash === hashPassword(password)) {
      return { ok: true, name: u.fullName || u.username, role: u.role };
    }
  } catch {
    /* users table may not exist yet */
  }
  return { ok: false, name: "", role: "" };
}

/** Display name of the current user, used for the audit trail. */
export function currentUser(): string {
  const c = cookies().get(USER_COOKIE)?.value;
  return c ? decodeURIComponent(c) : "system";
}

export function currentRole(): string {
  // When no password is configured the app is open — treat as admin.
  if (!passwordRequired()) return "ADMIN";
  return cookies().get(ROLE_COOKIE)?.value || "USER";
}

export function isAdmin(): boolean {
  return currentRole() === "ADMIN";
}
