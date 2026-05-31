import { db } from "@/db";
import { assets, categories, subCategories, locations, depreciationRuns, depreciationLines, disposals } from "@/db/schema";
import { eq, desc, asc, and, gte, lte, inArray } from "drizzle-orm";
import { num, round2 } from "@/lib/format";

export interface DepMovementRow {
  code: string;
  name: string;
  opening: number;
  charge: number;
  disposal: number;
  closing: number;
}

/** Monthly accumulated-depreciation movement per category, from posted runs + disposals. */
export async function depreciationMovement(
  year: number,
  month: number
): Promise<{ rows: DepMovementRow[]; hasRun: boolean }> {
  const mm = String(month).padStart(2, "0");
  const start = `${year}-${mm}-01`;
  const endDate = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10); // last day of month

  const runs = await db
    .select()
    .from(depreciationRuns)
    .where(and(eq(depreciationRuns.status, "POSTED"), gte(depreciationRuns.periodEnd, start), lte(depreciationRuns.periodEnd, endDate)));
  const runIds = runs.map((r) => r.id);

  const map = new Map<string, DepMovementRow>();
  const get = (code: string, name: string) =>
    map.get(code) || map.set(code, { code, name, opening: 0, charge: 0, disposal: 0, closing: 0 }).get(code)!;

  if (runIds.length) {
    const lines = await db
      .select({ line: depreciationLines, asset: assets, cat: categories })
      .from(depreciationLines)
      .innerJoin(assets, eq(depreciationLines.assetId, assets.id))
      .leftJoin(categories, eq(assets.categoryId, categories.id))
      .where(inArray(depreciationLines.runId, runIds));
    for (const { line, asset, cat } of lines) {
      const e = get(cat?.code || "—", cat?.name || "Uncategorised");
      const cost = num(asset.cost);
      e.opening = round2(e.opening + (cost - num(line.openingNbv)));
      e.charge = round2(e.charge + num(line.depreciation));
      e.closing = round2(e.closing + (cost - num(line.closingNbv)));
    }
  }

  const disp = await db
    .select({ d: disposals, cat: categories })
    .from(disposals)
    .innerJoin(assets, eq(disposals.assetId, assets.id))
    .leftJoin(categories, eq(assets.categoryId, categories.id))
    .where(and(gte(disposals.disposalDate, start), lte(disposals.disposalDate, endDate)));
  for (const { d, cat } of disp) {
    const e = get(cat?.code || "—", cat?.name || "Uncategorised");
    const dep = num(d.accumDepAtDisposal);
    e.disposal = round2(e.disposal + dep);
    e.opening = round2(e.opening + dep); // disposed assets' accum was part of opening balance
  }

  return { rows: Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name)), hasRun: runIds.length > 0 };
}

export async function getActiveSubCategories() {
  return db.select().from(subCategories).where(eq(subCategories.active, true)).orderBy(asc(subCategories.code));
}
export async function getAllSubCategories() {
  return db.select().from(subCategories).orderBy(asc(subCategories.code));
}
export async function getActiveLocations() {
  return db.select().from(locations).where(eq(locations.active, true)).orderBy(asc(locations.code));
}
export async function getAllLocations() {
  return db.select().from(locations).orderBy(asc(locations.code));
}

export interface AssetWithCat {
  asset: typeof assets.$inferSelect;
  category: typeof categories.$inferSelect | null;
}

export function nbv(a: { cost: string | number; accumulatedDepreciation: string | number }): number {
  return round2(num(a.cost as string) - num(a.accumulatedDepreciation as string));
}

export async function getAssetsWithCategory() {
  return db
    .select({ asset: assets, category: categories })
    .from(assets)
    .leftJoin(categories, eq(assets.categoryId, categories.id))
    .orderBy(assets.assetTag);
}

export async function getActiveCategories() {
  return db.select().from(categories).where(eq(categories.active, true)).orderBy(categories.code);
}

export async function getAllCategories() {
  return db.select().from(categories).orderBy(categories.code);
}

export async function getActiveAssets() {
  return db.select().from(assets).where(eq(assets.status, "ACTIVE")).orderBy(assets.assetTag);
}

export interface FarTotals {
  count: number;
  active: number;
  totalCost: number;
  totalAccumDep: number;
  totalNbv: number;
}

/** Statuses that remain on the books (counted in cost/depreciation totals). */
export const ON_BOOKS = new Set(["ACTIVE", "FULLY_DEPRECIATED"]);
export function onBooks(status: string): boolean {
  return ON_BOOKS.has(status);
}

export function computeTotals(rows: AssetWithCat[]): FarTotals {
  let totalCost = 0,
    totalAccumDep = 0,
    active = 0,
    onbook = 0;
  for (const r of rows) {
    if (!onBooks(r.asset.status)) continue; // disposed/written-off excluded
    onbook++;
    totalCost += num(r.asset.cost);
    totalAccumDep += num(r.asset.accumulatedDepreciation);
    if (r.asset.status === "ACTIVE") active++;
  }
  return {
    count: onbook,
    active,
    totalCost: round2(totalCost),
    totalAccumDep: round2(totalAccumDep),
    totalNbv: round2(totalCost - totalAccumDep),
  };
}

export interface CategoryBreakdown {
  code: string;
  name: string;
  count: number;
  cost: number;
  nbv: number;
}

export interface CategorySummaryRow {
  code: string;
  name: string;
  rate: string;
  count: number;
  openingCost: number;
  additions: number;
  cost: number;
  accumDep: number;
  nbv: number;
}

/** Category-wise summary; additions = assets acquired within [yearStart, yearEnd]. */
export function categorySummary(rows: AssetWithCat[], year: number): CategorySummaryRow[] {
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;
  const map = new Map<string, CategorySummaryRow>();
  for (const r of rows) {
    if (!onBooks(r.asset.status)) continue; // disposed assets removed from cost/dep
    const key = r.category?.code || "—";
    const e =
      map.get(key) ||
      ({
        code: r.category?.code || "—",
        name: r.category?.name || "Uncategorised",
        rate: r.category?.defaultRate || "0",
        count: 0,
        openingCost: 0,
        additions: 0,
        cost: 0,
        accumDep: 0,
        nbv: 0,
      } as CategorySummaryRow);
    const cost = num(r.asset.cost);
    const isAddition = r.asset.acquisitionDate >= start && r.asset.acquisitionDate <= end;
    e.count++;
    e.cost = round2(e.cost + cost);
    if (isAddition) e.additions = round2(e.additions + cost);
    else e.openingCost = round2(e.openingCost + cost);
    e.accumDep = round2(e.accumDep + num(r.asset.accumulatedDepreciation));
    e.nbv = round2(e.nbv + nbv(r.asset));
    map.set(key, e);
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function breakdownByCategory(rows: AssetWithCat[]): CategoryBreakdown[] {
  const map = new Map<string, CategoryBreakdown>();
  for (const r of rows) {
    const code = r.category?.code || "—";
    const name = r.category?.name || "Uncategorised";
    const entry = map.get(code) || { code, name, count: 0, cost: 0, nbv: 0 };
    entry.count++;
    entry.cost = round2(entry.cost + num(r.asset.cost));
    entry.nbv = round2(entry.nbv + nbv(r.asset));
    map.set(code, entry);
  }
  return Array.from(map.values()).sort((a, b) => b.cost - a.cost);
}
