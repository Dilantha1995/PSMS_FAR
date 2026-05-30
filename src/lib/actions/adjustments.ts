"use server";

import { db } from "@/db";
import { assets, adjustments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity";
import { currentUser } from "@/lib/auth";
import { num, round2 } from "@/lib/format";

const FIELD_MAP: Record<string, keyof typeof assets.$inferSelect> = {
  cost: "cost",
  residualValue: "residualValue",
  rate: "rate",
  usefulLife: "usefulLife",
  accumulatedDepreciation: "accumulatedDepreciation",
};

export async function createAdjustment(formData: FormData) {
  const assetId = Number(formData.get("assetId"));
  const type = String(formData.get("type") || "OTHER") as any;
  const adjustmentDate = String(formData.get("adjustmentDate") || "");
  const field = String(formData.get("field") || "");
  const newValueRaw = String(formData.get("newValue") || "");
  const reason = String(formData.get("reason") || "") || null;
  const approvedBy = String(formData.get("approvedBy") || "") || null;

  const [asset] = await db.select().from(assets).where(eq(assets.id, assetId));
  if (!asset) throw new Error("Asset not found");

  let oldValue = "";
  let amount = 0;
  const update: Record<string, unknown> = { updatedAt: new Date() };

  if (field && FIELD_MAP[field]) {
    const col = FIELD_MAP[field];
    oldValue = String((asset as any)[col]);
    if (field === "usefulLife") {
      const nv = Math.round(num(newValueRaw));
      amount = nv - num(oldValue);
      update[col] = nv;
    } else {
      const nv = round2(num(newValueRaw));
      amount = round2(nv - num(oldValue));
      update[col] = String(nv);
    }
    await db.update(assets).set(update).where(eq(assets.id, assetId));
  } else {
    amount = round2(num(newValueRaw));
  }

  await db.insert(adjustments).values({
    assetId: asset.id,
    assetTag: asset.assetTag,
    assetName: asset.name,
    type,
    adjustmentDate,
    field: field || null,
    oldValue: oldValue || null,
    newValue: newValueRaw || null,
    amount: String(amount),
    reason,
    approvedBy,
    createdBy: currentUser(),
  });

  await logActivity({
    action: "ADJUSTMENT_POSTED",
    entityType: "ASSET",
    entityId: asset.id,
    entityLabel: `${asset.assetTag} — ${asset.name}`,
    summary: `Adjustment (${type}) on ${asset.assetTag}${
      field ? `: ${field} ${oldValue} → ${newValueRaw}` : ` amount ${amount}`
    }`,
    details: { type, field, oldValue, newValue: newValueRaw, amount },
    user: currentUser(),
  });

  revalidatePath("/adjustments");
  revalidatePath("/assets");
  revalidatePath(`/assets/${assetId}`);
  redirect(`/assets/${assetId}`);
}
