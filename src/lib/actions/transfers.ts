"use server";

import { db } from "@/db";
import { assets, transfers, documents, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity";
import { currentUser } from "@/lib/auth";
import { nextReference } from "@/lib/reference";

export async function createTransfer(formData: FormData) {
  const assetId = Number(formData.get("assetId"));
  const transferDate = String(formData.get("transferDate") || "");
  const toLocation = String(formData.get("toLocation") || "") || null;
  const toCustodian = String(formData.get("toCustodian") || "") || null;
  const toDepartment = String(formData.get("toDepartment") || "") || null;
  const reason = String(formData.get("reason") || "") || null;
  const approvedBy = String(formData.get("approvedBy") || "") || null;
  const external = formData.get("external") === "on";

  const [asset] = await db.select().from(assets).where(eq(assets.id, assetId));
  if (!asset) throw new Error("Asset not found");

  const [cat] = await db.select().from(categories).where(eq(categories.id, asset.categoryId));

  const referenceNo = await nextReference("TRANSFER");
  const user = currentUser();

  const payload = {
    kind: "TRANSFER",
    assetTag: asset.assetTag,
    assetName: asset.name,
    serialNo: asset.serialNo,
    category: cat ? `${cat.code} — ${cat.name}` : "",
    transferDate,
    from: { location: asset.location, custodian: asset.custodian, department: asset.department },
    to: { location: toLocation, custodian: toCustodian, department: toDepartment },
    external,
    reason,
    approvedBy,
    preparedBy: user,
  };

  const [doc] = await db
    .insert(documents)
    .values({
      referenceNo,
      type: "TRANSFER",
      title: `Asset Transfer Note — ${asset.assetTag}`,
      relatedAssetId: asset.id,
      relatedAssetTag: asset.assetTag,
      payload,
      pageCount: 1,
      createdBy: user,
    })
    .returning();

  await db.insert(transfers).values({
    referenceNo,
    assetId: asset.id,
    assetTag: asset.assetTag,
    assetName: asset.name,
    transferDate,
    fromLocation: asset.location,
    toLocation,
    fromCustodian: asset.custodian,
    toCustodian,
    fromDepartment: asset.department,
    toDepartment,
    reason,
    approvedBy,
    documentId: doc.id,
    createdBy: user,
  });

  // Update the asset's current location/custodian. Mark TRANSFERRED only if it left the company.
  await db
    .update(assets)
    .set({
      location: toLocation ?? asset.location,
      custodian: toCustodian ?? asset.custodian,
      department: toDepartment ?? asset.department,
      status: external ? "TRANSFERRED" : asset.status,
      updatedAt: new Date(),
    })
    .where(eq(assets.id, asset.id));

  await logActivity({
    action: "ASSET_TRANSFERRED",
    entityType: "ASSET",
    entityId: asset.id,
    entityLabel: `${asset.assetTag} — ${asset.name}`,
    summary: `Transferred ${asset.assetTag} from ${asset.location || "-"} to ${toLocation || "-"}${
      external ? " (external)" : ""
    }. Doc ${referenceNo}`,
    details: { referenceNo, documentId: doc.id, from: asset.location, to: toLocation, external },
    user,
  });

  revalidatePath("/transfers");
  revalidatePath("/assets");
  revalidatePath("/documents");
  redirect(`/documents/${doc.id}`);
}
