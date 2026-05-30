"use server";

import { db } from "@/db";
import { subCategories, locations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity";
import { currentUser } from "@/lib/auth";

export async function createSubCategory(formData: FormData) {
  const categoryId = Number(formData.get("categoryId"));
  const code = String(formData.get("code") || "").trim().toUpperCase();
  const name = String(formData.get("name") || "").trim();
  if (!categoryId || !code || !name) throw new Error("Category, code and name are required");

  await db.insert(subCategories).values({ categoryId, code, name });
  await logActivity({
    action: "SUBCATEGORY_CREATED",
    entityType: "SUBCATEGORY",
    summary: `Created sub-category ${code} — ${name}`,
    user: currentUser(),
  });
  revalidatePath("/setup");
  redirect("/setup");
}

export async function updateSubCategory(formData: FormData) {
  const id = Number(formData.get("id"));
  await db
    .update(subCategories)
    .set({
      code: String(formData.get("code") || "").trim().toUpperCase(),
      name: String(formData.get("name") || "").trim(),
      categoryId: Number(formData.get("categoryId")),
      active: formData.get("active") === "on",
    })
    .where(eq(subCategories.id, id));
  revalidatePath("/setup");
  redirect("/setup");
}

export async function createLocation(formData: FormData) {
  const code = String(formData.get("code") || "").trim().toUpperCase();
  const name = String(formData.get("name") || "").trim();
  if (!code || !name) throw new Error("Code and name are required");

  await db.insert(locations).values({ code, name });
  await logActivity({
    action: "LOCATION_CREATED",
    entityType: "LOCATION",
    summary: `Created location ${code} — ${name}`,
    user: currentUser(),
  });
  revalidatePath("/setup");
  redirect("/setup");
}

export async function updateLocation(formData: FormData) {
  const id = Number(formData.get("id"));
  await db
    .update(locations)
    .set({
      code: String(formData.get("code") || "").trim().toUpperCase(),
      name: String(formData.get("name") || "").trim(),
      active: formData.get("active") === "on",
    })
    .where(eq(locations.id, id));
  revalidatePath("/setup");
  redirect("/setup");
}
