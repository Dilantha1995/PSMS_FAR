// Seed the database with a starter chart of asset categories and a few sample
// assets. Run with:  npm run db:seed   (requires DATABASE_URL).
//
// Uses relative imports (not the "@/..." alias) so it runs cleanly under tsx.

try {
  // Node 20.12+/22: load .env without an extra dependency.
  // @ts-ignore - available at runtime
  process.loadEnvFile?.();
} catch {
  /* .env optional if DATABASE_URL is already exported */
}

import { db } from "./index";
import { categories, assets } from "./schema";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Add it to .env or export it, then re-run.");
    process.exit(1);
  }

  console.log("Seeding categories…");
  const catSeed = [
    { code: "IT", name: "IT Equipment", defaultMethod: "STRAIGHT_LINE" as const, defaultRate: "33.33", defaultUsefulLife: 3 },
    { code: "MED", name: "Medical Equipment", defaultMethod: "STRAIGHT_LINE" as const, defaultRate: "20", defaultUsefulLife: 5 },
    { code: "FURN", name: "Furniture & Fixtures", defaultMethod: "STRAIGHT_LINE" as const, defaultRate: "10", defaultUsefulLife: 10 },
    { code: "OFF", name: "Office Equipment", defaultMethod: "STRAIGHT_LINE" as const, defaultRate: "20", defaultUsefulLife: 5 },
    { code: "VEH", name: "Motor Vehicles", defaultMethod: "REDUCING_BALANCE" as const, defaultRate: "20", defaultUsefulLife: 0 },
  ];

  const inserted = await db.insert(categories).values(catSeed).onConflictDoNothing().returning();
  const all = await db.select().from(categories);
  const byCode = new Map(all.map((c) => [c.code, c]));
  console.log(`  ${inserted.length} new categories (${all.length} total).`);

  console.log("Seeding sample assets…");
  const sample = [
    {
      assetTag: "PSMS-IT-0001",
      name: "Dell OptiPlex Desktop",
      categoryId: byCode.get("IT")!.id,
      location: "Accounts Dept",
      custodian: "Accounts",
      acquisitionDate: "2024-01-15",
      cost: "18500",
      residualValue: "500",
      method: "STRAIGHT_LINE" as const,
      rate: "33.33",
      usefulLife: 3,
      depreciationStart: "2024-01-15",
    },
    {
      assetTag: "PSMS-MED-0001",
      name: "Patient Examination Bed",
      categoryId: byCode.get("MED")!.id,
      location: "Synergy Care Clinic",
      custodian: "Clinic",
      acquisitionDate: "2023-06-01",
      cost: "42000",
      residualValue: "2000",
      method: "STRAIGHT_LINE" as const,
      rate: "20",
      usefulLife: 5,
      depreciationStart: "2023-06-01",
    },
    {
      assetTag: "PSMS-FURN-0001",
      name: "Reception Counter",
      categoryId: byCode.get("FURN")!.id,
      location: "Reception",
      acquisitionDate: "2022-09-10",
      cost: "26000",
      residualValue: "0",
      method: "STRAIGHT_LINE" as const,
      rate: "10",
      usefulLife: 10,
      depreciationStart: "2022-09-10",
    },
  ];

  const insAssets = await db.insert(assets).values(sample).onConflictDoNothing().returning();
  console.log(`  ${insAssets.length} new sample assets.`);

  console.log("Done.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
