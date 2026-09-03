"use server";

import { db } from "@/db";
import { assets, transfers, documents, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity";
import { currentUser, isAdmin } from "@/lib/auth";
import { nextReference } from "@/lib/reference";

export async function createTransfer(formData: FormData) {
  const assetId = Number(formData.get("assetId"));
  const transferDate = String(formData.get("transferDate") || "");
  const toLocation = String(formData.get("toLocation") || "") || null;
  const toCustodian = String(formData.get("toCustodian") || "") || null;
  const toDepartment = String(formData.get("toDepartment") || "") || null;
  const toDesignation = String(formData.get("toDesignation") || "") || null;
  const accessories = String(formData.get("accessories") || "") || null;
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
    to: { location: toLocation, custodian: toCustodian, department: toDepartment, designation: toDesignation },
    external,
    accessories,
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

/**
 * Generates a Transfer Note for an asset that isn't (yet, or won't be) in the
 * FAR — every field is typed in by hand. No asset/transfer record is
 * created since there's no registered asset to update; only the printable
 * document is saved, numbered from the same reference sequence.
 */
export async function createManualTransfer(formData: FormData) {
  const assetTag = String(formData.get("assetTag") || "").trim();
  const assetName = String(formData.get("assetName") || "").trim();
  const serialNo = String(formData.get("serialNo") || "").trim() || null;
  const category = String(formData.get("category") || "").trim() || null;
  const transferDate = String(formData.get("transferDate") || "");
  const fromLocation = String(formData.get("fromLocation") || "").trim() || null;
  const fromDepartment = String(formData.get("fromDepartment") || "").trim() || null;
  const fromCustodian = String(formData.get("fromCustodian") || "").trim() || null;
  const toLocation = String(formData.get("toLocation") || "").trim() || null;
  const toDepartment = String(formData.get("toDepartment") || "").trim() || null;
  const toCustodian = String(formData.get("toCustodian") || "").trim() || null;
  const toDesignation = String(formData.get("toDesignation") || "").trim() || null;
  const accessories = String(formData.get("accessories") || "").trim() || null;
  const reason = String(formData.get("reason") || "").trim() || null;
  const approvedBy = String(formData.get("approvedBy") || "").trim() || null;
  const external = formData.get("external") === "on";

  if (!assetTag || !assetName || !transferDate) {
    throw new Error("Asset Tag, Asset Name and Transfer Date are required");
  }

  const referenceNo = await nextReference("TRANSFER");
  const user = currentUser();

  const payload = {
    kind: "TRANSFER",
    manual: true,
    assetTag,
    assetName,
    serialNo,
    category,
    transferDate,
    from: { location: fromLocation, custodian: fromCustodian, department: fromDepartment },
    to: { location: toLocation, custodian: toCustodian, department: toDepartment, designation: toDesignation },
    external,
    accessories,
    reason,
    approvedBy,
    preparedBy: user,
  };

  const [doc] = await db
    .insert(documents)
    .values({
      referenceNo,
      type: "TRANSFER",
      title: `Asset Transfer Note (Manual) — ${assetTag}`,
      relatedAssetId: null,
      relatedAssetTag: assetTag,
      payload,
      pageCount: 1,
      createdBy: user,
    })
    .returning();

  await logActivity({
    action: "MANUAL_TRANSFER_NOTE_GENERATED",
    entityType: "DOCUMENT",
    entityId: doc.id,
    entityLabel: `${assetTag} — ${assetName}`,
    summary: `Generated a manual Transfer Note for ${assetTag} (not in FAR), from ${fromLocation || "-"} to ${
      toLocation || "-"
    }${external ? " (external)" : ""}. Doc ${referenceNo}`,
    details: { referenceNo, documentId: doc.id, from: fromLocation, to: toLocation, external },
    user,
  });

  revalidatePath("/transfers");
  revalidatePath("/documents");
  redirect(`/documents/${doc.id}`);
}

/**
 * Edits an already-generated Transfer Note. Admin-only: the note has
 * usually already been printed/handed over, so correcting it after the
 * fact is a privileged action, not something any user should do freely.
 * Updates the document's payload (what the note renders from) and, when
 * the transfer is FAR-linked, the mirrored row in the transfers list —
 * it does not touch the asset's current location/custodian, since a
 * later transfer may have already moved it on.
 */
export async function updateTransfer(formData: FormData) {
  if (!isAdmin()) throw new Error("Only administrators can edit an already-submitted transfer note.");

  const documentId = Number(formData.get("documentId"));
  const [doc] = await db.select().from(documents).where(eq(documents.id, documentId));
  if (!doc) throw new Error("Document not found");
  if (doc.type !== "TRANSFER") throw new Error("Only Transfer Notes can be edited here.");

  const assetTag = String(formData.get("assetTag") || "").trim();
  const assetName = String(formData.get("assetName") || "").trim();
  const serialNo = String(formData.get("serialNo") || "").trim() || null;
  const category = String(formData.get("category") || "").trim() || null;
  const transferDate = String(formData.get("transferDate") || "");
  const fromLocation = String(formData.get("fromLocation") || "").trim() || null;
  const fromDepartment = String(formData.get("fromDepartment") || "").trim() || null;
  const fromCustodian = String(formData.get("fromCustodian") || "").trim() || null;
  const toLocation = String(formData.get("toLocation") || "").trim() || null;
  const toDepartment = String(formData.get("toDepartment") || "").trim() || null;
  const toCustodian = String(formData.get("toCustodian") || "").trim() || null;
  const toDesignation = String(formData.get("toDesignation") || "").trim() || null;
  const accessories = String(formData.get("accessories") || "").trim() || null;
  const reason = String(formData.get("reason") || "").trim() || null;
  const approvedBy = String(formData.get("approvedBy") || "").trim() || null;
  const external = formData.get("external") === "on";

  if (!assetTag || !assetName || !transferDate) {
    throw new Error("Asset Code, Asset Name and Transfer Date are required");
  }

  const prevPayload = doc.payload as any;
  const payload = {
    ...prevPayload,
    assetTag,
    assetName,
    serialNo,
    category,
    transferDate,
    from: { location: fromLocation, custodian: fromCustodian, department: fromDepartment },
    to: { location: toLocation, custodian: toCustodian, department: toDepartment, designation: toDesignation },
    external,
    accessories,
    reason,
    approvedBy,
  };

  const user = currentUser();

  await db
    .update(documents)
    .set({
      title: prevPayload.manual ? `Asset Transfer Note (Manual) — ${assetTag}` : `Asset Transfer Note — ${assetTag}`,
      relatedAssetTag: assetTag,
      payload,
    })
    .where(eq(documents.id, documentId));

  // Keep the Transfers list in sync for FAR-linked notes (manual notes have no row there).
  await db
    .update(transfers)
    .set({
      assetTag,
      assetName,
      transferDate,
      fromLocation,
      toLocation,
      fromCustodian,
      toCustodian,
      fromDepartment,
      toDepartment,
      reason,
      approvedBy,
    })
    .where(eq(transfers.referenceNo, doc.referenceNo));

  await logActivity({
    action: "TRANSFER_NOTE_EDITED",
    entityType: "DOCUMENT",
    entityId: documentId,
    entityLabel: `${assetTag} — ${assetName}`,
    summary: `Edited Transfer Note ${doc.referenceNo} (${assetTag})`,
    details: { referenceNo: doc.referenceNo, documentId },
    user,
  });

  revalidatePath(`/documents/${documentId}`);
  revalidatePath("/documents");
  revalidatePath("/transfers");
  redirect(`/documents/${documentId}`);
}
