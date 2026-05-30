import { db } from "@/db";
import { assets, categories, subCategories, locations } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { num, round2 } from "@/lib/format";

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

export function computeTotals(rows: AssetWithCat[]): FarTotals {
  let totalCost = 0,
    totalAccumDep = 0,
    active = 0;
  for (const r of rows) {
    totalCost += num(r.asset.cost);
    totalAccumDep += num(r.asset.accumulatedDepreciation);
    if (r.asset.status === "ACTIVE") active++;
  }
  return {
    count: rows.length,
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
