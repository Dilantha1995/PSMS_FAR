"use server";

import { db } from "@/db";
import { assets, disposals, documents, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity";
import { currentUser } from "@/lib/auth";
import { nextReference } from "@/lib/reference";
import { num, round2 } from "@/lib/format";

export async function createDisposal(formData: FormData) {
  const assetId = Number(formData.get("assetId"));
  const disposalDate = String(formData.get("disposalDate") || "");
  const method = String(formData.get("method") || "SALE") as any;
  const proceeds = round2(num(formData.get("proceeds") as string));
  const buyer = String(formData.get("buyer") || "") || null;
  const reason = String(formData.get("reason") || "") || null;
  const approvedBy = String(formData.get("approvedBy") || "") || null;

  const [asset] = await db.select().from(assets).where(eq(assets.id, assetId));
  if (!asset) throw new Error("Asset not found");
  if (asset.status === "DISPOSED") throw new Error("Asset is already disposed");

  const [cat] = await db.select().from(categories).where(eq(categories.id, asset.categoryId));

  const cost = round2(num(asset.cost));
  const accumDep = round2(num(asset.accumulatedDepreciation));
  const nbv = round2(cost - accumDep);
  const gainLoss = round2(proceeds - nbv);

  const referenceNo = await nextReference("DISPOSAL");
  const user = currentUser();

  const payload = {
    kind: "DISPOSAL",
    assetTag: asset.assetTag,
    assetName: asset.name,
    description: asset.description,
    serialNo: asset.serialNo,
    category: cat ? `${cat.code} — ${cat.name}` : "",
    acquisitionDate: asset.acquisitionDate,
    disposalDate,
    method,
    cost,
    accumDep,
    nbv,
    proceeds,
    gainLoss,
    buyer,
    reason,
    approvedBy,
    preparedBy: user,
  };

  const [doc] = await db
    .insert(documents)
    .values({
      referenceNo,
      type: "DISPOSAL",
      title: `Asset Disposal Note — ${asset.assetTag}`,
      relatedAssetId: asset.id,
      relatedAssetTag: asset.assetTag,
      payload,
      pageCount: 1,
      createdBy: user,
    })
    .returning();

  await db.insert(disposals).values({
    referenceNo,
    assetId: asset.id,
    assetTag: asset.assetTag,
    assetName: asset.name,
    disposalDate,
    method,
    proceeds: String(proceeds),
    costAtDisposal: String(cost),
    accumDepAtDisposal: String(accumDep),
    nbvAtDisposal: String(nbv),
    gainLoss: String(gainLoss),
    buyer,
    reason,
    approvedBy,
    documentId: doc.id,
    createdBy: user,
  });

  await db.update(assets).set({ status: "DISPOSED", updatedAt: new Date() }).where(eq(assets.id, asset.id));

  await logActivity({
    action: "ASSET_DISPOSED",
    entityType: "ASSET",
    entityId: asset.id,
    entityLabel: `${asset.assetTag} — ${asset.name}`,
    summary: `Disposed ${asset.assetTag} (${method}); NBV ${nbv}, proceeds ${proceeds}, gain/loss ${gainLoss}. Doc ${referenceNo}`,
    details: { referenceNo, documentId: doc.id, nbv, proceeds, gainLoss },
    user,
  });

  revalidatePath("/disposals");
  revalidatePath("/assets");
  revalidatePath("/documents");
  revalidatePath("/");
  redirect(`/documents/${doc.id}`);
}
