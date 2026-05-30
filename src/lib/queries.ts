import { db } from "@/db";
import { assets, categories } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { num, round2 } from "@/lib/format";

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
