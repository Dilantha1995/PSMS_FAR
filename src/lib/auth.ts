import { cookies } from "next/headers";
import { createHash } from "crypto";

export const AUTH_COOKIE = "far_auth";
export const USER_COOKIE = "far_user";

export function authToken(): string {
  const pw = process.env.APP_PASSWORD || "";
  return createHash("sha256").update(pw + "::psms-far").digest("hex");
}

export function passwordRequired(): boolean {
  return !!process.env.APP_PASSWORD;
}

export function checkPassword(input: string): boolean {
  const pw = process.env.APP_PASSWORD || "";
  if (!pw) return true; // no password configured -> open (dev)
  return input === pw;
}

/** Display name of the current user, used for the audit trail. */
export function currentUser(): string {
  const c = cookies().get(USER_COOKIE)?.value;
  return c ? decodeURIComponent(c) : "system";
}
