"use server";

import { db } from "@/db";
import { settings, assets, depreciationLines, depreciationRuns, disposals, transfers, adjustments, documents } from "@/db/schema";
import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity";
import { currentUser, isAdmin } from "@/lib/auth";

function requireAdmin() {
  if (!isAdmin()) throw new Error("Only administrators can change settings.");
}

async function setSetting(key: string, value: string) {
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } });
}

export async function updateCoding(formData: FormData) {
  requireAdmin();
  const prefix = String(formData.get("prefix") || "PSMS").trim() || "PSMS";
  const separator = (String(formData.get("separator") || "/").trim() || "/").slice(0, 1);
  let padding = Math.round(Number(formData.get("padding")) || 3);
  if (padding < 1) padding = 1;
  if (padding > 8) padding = 8;

  await setSetting("code_prefix", prefix);
  await setSetting("code_separator", separator);
  await setSetting("code_padding", String(padding));

  await logActivity({
    action: "SETTINGS_UPDATED",
    entityType: "SETTINGS",
    summary: `Updated asset code rules: ${prefix}${separator}…${separator}${"0".repeat(padding)}`,
    user: currentUser(),
  });
  revalidatePath("/settings");
  redirect("/settings");
}

export async function deleteAllAssets(formData: FormData) {
  requireAdmin();
  const confirm = String(formData.get("confirm") || "").trim();
  if (confirm !== "DELETE") {
    redirect("/settings?err=" + encodeURIComponent('You must type DELETE to confirm.'));
  }

  // Remove dependent rows first, then the assets themselves.
  await db.delete(depreciationLines);
  await db.delete(depreciationRuns);
  await db.delete(disposals);
  await db.delete(transfers);
  await db.delete(adjustments);
  await db.delete(documents);
  const removed = await db.delete(assets).returning({ id: assets.id });

  await logActivity({
    action: "ASSETS_DELETED_ALL",
    entityType: "ASSET",
    summary: `Deleted ALL assets (${removed.length}) and related records`,
    user: currentUser(),
  });
  revalidatePath("/assets");
  revalidatePath("/");
  redirect(`/settings?ok=${removed.length}`);
}
