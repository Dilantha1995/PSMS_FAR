"use server";

import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity";
import { currentUser } from "@/lib/auth";
import { num } from "@/lib/format";

export async function createCategory(formData: FormData) {
  const code = String(formData.get("code") || "").trim();
  const name = String(formData.get("name") || "").trim();
  if (!code || !name) throw new Error("Code and name are required");

  const [row] = await db
    .insert(categories)
    .values({
      code,
      name,
      description: String(formData.get("description") || "") || null,
      defaultMethod: String(formData.get("defaultMethod") || "STRAIGHT_LINE") as any,
      defaultRate: String(num(formData.get("defaultRate") as string)),
      defaultUsefulLife: Math.round(num(formData.get("defaultUsefulLife") as string)),
    })
    .returning();

  await logActivity({
    action: "CATEGORY_CREATED",
    entityType: "CATEGORY",
    entityId: row.id,
    entityLabel: `${row.code} — ${row.name}`,
    summary: `Created category ${row.code} — ${row.name}`,
    user: currentUser(),
  });
  revalidatePath("/categories");
  redirect("/categories");
}

export async function updateCategory(formData: FormData) {
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  const code = String(formData.get("code") || "").trim();
  await db
    .update(categories)
    .set({
      code,
      name,
      description: String(formData.get("description") || "") || null,
      defaultMethod: String(formData.get("defaultMethod") || "STRAIGHT_LINE") as any,
      defaultRate: String(num(formData.get("defaultRate") as string)),
      defaultUsefulLife: Math.round(num(formData.get("defaultUsefulLife") as string)),
      active: formData.get("active") === "on",
    })
    .where(eq(categories.id, id));

  await logActivity({
    action: "CATEGORY_UPDATED",
    entityType: "CATEGORY",
    entityId: id,
    entityLabel: name,
    summary: `Updated category ${name}`,
    user: currentUser(),
  });
  revalidatePath("/categories");
  redirect("/categories");
}
