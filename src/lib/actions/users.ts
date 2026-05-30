"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity";
import { currentUser, isAdmin, hashPassword } from "@/lib/auth";

function requireAdmin() {
  if (!isAdmin()) throw new Error("Only administrators can manage users.");
}

export async function createUser(formData: FormData) {
  requireAdmin();
  const username = String(formData.get("username") || "").trim().toLowerCase();
  const fullName = String(formData.get("fullName") || "").trim() || null;
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "USER") === "ADMIN" ? "ADMIN" : "USER";
  if (!username || !password) throw new Error("Username and password are required");

  await db.insert(users).values({ username, fullName, passwordHash: hashPassword(password), role });
  await logActivity({
    action: "USER_CREATED",
    entityType: "USER",
    summary: `Created user ${username} (${role})`,
    user: currentUser(),
  });
  revalidatePath("/settings");
  redirect("/settings");
}

export async function setUserActive(formData: FormData) {
  requireAdmin();
  const id = Number(formData.get("id"));
  const active = formData.get("active") === "1";
  await db.update(users).set({ active }).where(eq(users.id, id));
  revalidatePath("/settings");
  redirect("/settings");
}

export async function resetUserPassword(formData: FormData) {
  requireAdmin();
  const id = Number(formData.get("id"));
  const password = String(formData.get("password") || "");
  if (!password) throw new Error("Password required");
  await db.update(users).set({ passwordHash: hashPassword(password) }).where(eq(users.id, id));
  await logActivity({
    action: "USER_PASSWORD_RESET",
    entityType: "USER",
    entityId: id,
    summary: `Reset password for user #${id}`,
    user: currentUser(),
  });
  revalidatePath("/settings");
  redirect("/settings");
}

export async function deleteUser(formData: FormData) {
  requireAdmin();
  const id = Number(formData.get("id"));
  await db.delete(users).where(eq(users.id, id));
  await logActivity({
    action: "USER_DELETED",
    entityType: "USER",
    entityId: id,
    summary: `Deleted user #${id}`,
    user: currentUser(),
  });
  revalidatePath("/settings");
  redirect("/settings");
}
