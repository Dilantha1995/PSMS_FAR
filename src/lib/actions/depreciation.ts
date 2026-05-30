"use server";

import { db } from "@/db";
import { assets, depreciationRuns, depreciationLines } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity";
import { currentUser } from "@/lib/auth";
import { depreciateAsset, DepAssetInput, round2 } from "@/lib/depreciation";
import { num } from "@/lib/format";

function toDepInput(a: typeof assets.$inferSelect): DepAssetInput {
  return {
    id: a.id,
    assetTag: a.assetTag,
    name: a.name,
    cost: num(a.cost),
    residualValue: num(a.residualValue),
    accumulatedDepreciation: num(a.accumulatedDepreciation),
    method: a.method,
    rate: num(a.rate),
    usefulLife: a.usefulLife,
    acquisitionDate: a.acquisitionDate,
    depreciationStart: a.depreciationStart,
    status: a.status,
  };
}

export async function createRun(formData: FormData) {
  const label = String(formData.get("label") || "").trim();
  const periodStart = String(formData.get("periodStart") || "");
  const periodEnd = String(formData.get("periodEnd") || "");
  const notes = String(formData.get("notes") || "") || null;
  if (!label || !periodStart || !periodEnd) throw new Error("Label and period dates are required");

  const all = await db.select().from(assets).where(eq(assets.status, "ACTIVE"));
  const lines = all
    .map((a) => depreciateAsset(toDepInput(a), periodStart, periodEnd))
    .filter((l) => l.depreciation > 0);

  const total = round2(lines.reduce((s, l) => s + l.depreciation, 0));

  const [run] = await db
    .insert(depreciationRuns)
    .values({
      label,
      periodStart,
      periodEnd,
      status: "DRAFT",
      totalDepreciation: String(total),
      assetCount: lines.length,
      notes,
      createdBy: currentUser(),
    })
    .returning();

  if (lines.length) {
    await db.insert(depreciationLines).values(
      lines.map((l) => ({
        runId: run.id,
        assetId: l.assetId,
        assetTag: l.assetTag,
        assetName: l.assetName,
        openingNbv: String(l.openingNbv),
        depreciation: String(l.depreciation),
        closingNbv: String(l.closingNbv),
        method: l.method,
      }))
    );
  }

  await logActivity({
    action: "DEPRECIATION_RUN_CREATED",
    entityType: "DEPRECIATION_RUN",
    entityId: run.id,
    entityLabel: label,
    summary: `Created draft depreciation run "${label}" (${periodStart} → ${periodEnd}): ${lines.length} assets, total ${total}`,
    user: currentUser(),
  });

  revalidatePath("/depreciation");
  redirect(`/depreciation/${run.id}`);
}

export async function postRun(formData: FormData) {
  const runId = Number(formData.get("runId"));
  const [run] = await db.select().from(depreciationRuns).where(eq(depreciationRuns.id, runId));
  if (!run) throw new Error("Run not found");
  if (run.status === "POSTED") throw new Error("Run already posted");

  const lines = await db.select().from(depreciationLines).where(eq(depreciationLines.runId, runId));

  for (const line of lines) {
    const [asset] = await db.select().from(assets).where(eq(assets.id, line.assetId));
    if (!asset) continue;
    const newAccum = round2(num(asset.accumulatedDepreciation) + num(line.depreciation));
    const nbv = round2(num(asset.cost) - newAccum);
    const fullyDep = nbv <= num(asset.residualValue) + 0.009;
    await db
      .update(assets)
      .set({
        accumulatedDepreciation: String(newAccum),
        status: fullyDep && asset.status === "ACTIVE" ? "FULLY_DEPRECIATED" : asset.status,
        updatedAt: new Date(),
      })
      .where(eq(assets.id, asset.id));
  }

  await db
    .update(depreciationRuns)
    .set({ status: "POSTED", postedBy: currentUser(), postedAt: new Date() })
    .where(eq(depreciationRuns.id, runId));

  await logActivity({
    action: "DEPRECIATION_RUN_POSTED",
    entityType: "DEPRECIATION_RUN",
    entityId: runId,
    entityLabel: run.label,
    summary: `Posted depreciation run "${run.label}" — ${run.assetCount} assets, total ${run.totalDepreciation} recorded to accumulated depreciation`,
    details: { total: run.totalDepreciation, assetCount: run.assetCount },
    user: currentUser(),
  });

  revalidatePath("/depreciation");
  revalidatePath(`/depreciation/${runId}`);
  revalidatePath("/assets");
  revalidatePath("/");
  redirect(`/depreciation/${runId}`);
}

export async function deleteRun(formData: FormData) {
  const runId = Number(formData.get("runId"));
  const [run] = await db.select().from(depreciationRuns).where(eq(depreciationRuns.id, runId));
  if (!run) throw new Error("Run not found");
  if (run.status === "POSTED") throw new Error("Cannot delete a posted run");
  await db.delete(depreciationRuns).where(eq(depreciationRuns.id, runId));
  await logActivity({
    action: "DEPRECIATION_RUN_DELETED",
    entityType: "DEPRECIATION_RUN",
    entityId: runId,
    entityLabel: run.label,
    summary: `Deleted draft depreciation run "${run.label}"`,
    user: currentUser(),
  });
  revalidatePath("/depreciation");
  redirect("/depreciation");
}
