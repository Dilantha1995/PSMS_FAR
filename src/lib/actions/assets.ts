"use server";

import { db } from "@/db";
import { assets, categories, depreciationLines, disposals, transfers, adjustments, documents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity";
import { currentUser, isAdmin } from "@/lib/auth";
import { num } from "@/lib/format";

function readAssetForm(formData: FormData) {
  return {
    assetTag: String(formData.get("assetTag") || "").trim(),
    name: String(formData.get("name") || "").trim(),
    description: String(formData.get("description") || "") || null,
    categoryId: Number(formData.get("categoryId")),
    subCategoryId: formData.get("subCategoryId") ? Number(formData.get("subCategoryId")) : null,
    locationId: formData.get("locationId") ? Number(formData.get("locationId")) : null,
    location: String(formData.get("location") || "") || null,
    custodian: String(formData.get("custodian") || "") || null,
    department: String(formData.get("department") || "") || null,
    supplier: String(formData.get("supplier") || "") || null,
    invoiceNo: String(formData.get("invoiceNo") || "") || null,
    serialNo: String(formData.get("serialNo") || "") || null,
    acquisitionDate: String(formData.get("acquisitionDate") || ""),
    cost: String(num(formData.get("cost") as string)),
    residualValue: String(num(formData.get("residualValue") as string)),
    method: String(formData.get("method") || "STRAIGHT_LINE") as any,
    rate: String(num(formData.get("rate") as string)),
    usefulLife: Math.round(num(formData.get("usefulLife") as string)),
    depreciationStart: String(formData.get("depreciationStart") || "") || null,
    notes: String(formData.get("notes") || "") || null,
  };
}

export async function createAsset(formData: FormData) {
  const data = readAssetForm(formData);
  if (!data.assetTag || !data.name || !data.categoryId || !data.acquisitionDate) {
    throw new Error("Asset tag, name, category and acquisition date are required");
  }
  const openingAccum = String(num(formData.get("accumulatedDepreciation") as string));

  const [row] = await db
    .insert(assets)
    .values({
      ...data,
      depreciationStart: data.depreciationStart || data.acquisitionDate,
      accumulatedDepreciation: openingAccum,
      status: "ACTIVE",
    })
    .returning();

  await logActivity({
    action: "ASSET_CREATED",
    entityType: "ASSET",
    entityId: row.id,
    entityLabel: `${row.assetTag} — ${row.name}`,
    summary: `Added asset ${row.assetTag} — ${row.name} (cost ${data.cost})`,
    details: { cost: data.cost, categoryId: data.categoryId },
    user: currentUser(),
  });
  revalidatePath("/assets");
  revalidatePath("/");
  redirect(`/assets/${row.id}`);
}

export async function updateAsset(formData: FormData) {
  const id = Number(formData.get("id"));
  const data = readAssetForm(formData);
  await db
    .update(assets)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(assets.id, id));

  await logActivity({
    action: "ASSET_UPDATED",
    entityType: "ASSET",
    entityId: id,
    entityLabel: `${data.assetTag} — ${data.name}`,
    summary: `Updated asset ${data.assetTag} — ${data.name}`,
    user: currentUser(),
  });
  revalidatePath("/assets");
  revalidatePath(`/assets/${id}`);
  redirect(`/assets/${id}`);
}

export async function categoryDefaults(categoryId: number) {
  const [c] = await db.select().from(categories).where(eq(categories.id, categoryId));
  return c;
}

export async function deleteAsset(formData: FormData) {
  if (!isAdmin()) throw new Error("Only administrators can delete assets.");
  const id = Number(formData.get("id"));
  const [a] = await db.select().from(assets).where(eq(assets.id, id));
  if (!a) redirect("/assets");

  // Remove dependent rows first to satisfy foreign keys.
  await db.delete(depreciationLines).where(eq(depreciationLines.assetId, id));
  await db.delete(disposals).where(eq(disposals.assetId, id));
  await db.delete(transfers).where(eq(transfers.assetId, id));
  await db.delete(adjustments).where(eq(adjustments.assetId, id));
  await db.delete(documents).where(eq(documents.relatedAssetId, id));
  await db.delete(assets).where(eq(assets.id, id));

  await logActivity({
    action: "ASSET_DELETED",
    entityType: "ASSET",
    entityId: id,
    entityLabel: `${a.assetTag} — ${a.name}`,
    summary: `Deleted asset ${a.assetTag} — ${a.name}`,
    user: currentUser(),
  });
  revalidatePath("/assets");
  revalidatePath("/");
  redirect("/assets");
}
