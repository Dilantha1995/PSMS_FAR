"use server";

import { db } from "@/db";
import { assets, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity";
import { currentUser } from "@/lib/auth";
import { num } from "@/lib/format";
import * as XLSX from "xlsx";

// Map many possible header spellings to our canonical keys.
const ALIASES: Record<string, string> = {
  assettag: "assetTag",
  tag: "assetTag",
  assetcode: "assetTag",
  code: "assetTag",
  name: "name",
  assetname: "name",
  description: "description",
  desc: "description",
  category: "category",
  categorycode: "category",
  class: "category",
  location: "location",
  custodian: "custodian",
  department: "department",
  dept: "department",
  supplier: "supplier",
  vendor: "supplier",
  invoiceno: "invoiceNo",
  invoice: "invoiceNo",
  serialno: "serialNo",
  serial: "serialNo",
  serialnumber: "serialNo",
  acquisitiondate: "acquisitionDate",
  acquired: "acquisitionDate",
  purchasedate: "acquisitionDate",
  date: "acquisitionDate",
  cost: "cost",
  purchasecost: "cost",
  value: "cost",
  residualvalue: "residualValue",
  residual: "residualValue",
  salvage: "residualValue",
  method: "method",
  depreciationmethod: "method",
  rate: "rate",
  deprate: "rate",
  usefullife: "usefulLife",
  life: "usefulLife",
  accumulateddepreciation: "accumulatedDepreciation",
  accumdep: "accumulatedDepreciation",
  accumulated: "accumulatedDepreciation",
  depreciationstart: "depreciationStart",
  depstart: "depreciationStart",
};

function normKey(k: string): string {
  const cleaned = k.toLowerCase().replace(/[^a-z]/g, "");
  return ALIASES[cleaned] || "";
}

function toISO(v: unknown): string {
  if (!v) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v).trim();
  // already yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  // dd/mm/yyyy or dd-mm-yyyy
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (m) {
    const yr = m[3].length === 2 ? "20" + m[3] : m[3];
    return `${yr}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

function methodOf(v: unknown): "STRAIGHT_LINE" | "REDUCING_BALANCE" {
  const s = String(v || "").toLowerCase();
  if (s.includes("reduc") || s.includes("declin") || s.includes("wdv")) return "REDUCING_BALANCE";
  return "STRAIGHT_LINE";
}

export async function importAssets(formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) redirect("/import?err=" + encodeURIComponent("No file selected"));

  let rows: Record<string, unknown>[] = [];
  try {
    const buf = Buffer.from(await (file as File).arrayBuffer());
    const wb = XLSX.read(buf, { type: "buffer", cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
  } catch (e) {
    redirect("/import?err=" + encodeURIComponent("Could not read the file. Use .xlsx or .csv."));
  }

  if (rows.length === 0) redirect("/import?err=" + encodeURIComponent("The sheet has no data rows."));

  // Existing categories + assets
  const cats = await db.select().from(categories);
  const catByCode = new Map(cats.map((c) => [c.code.toLowerCase(), c]));
  const catByName = new Map(cats.map((c) => [c.name.toLowerCase(), c]));
  const existing = await db.select({ id: assets.id, assetTag: assets.assetTag }).from(assets);
  const assetByTag = new Map(existing.map((a) => [a.assetTag.toLowerCase(), a.id]));

  let imported = 0;
  let updated = 0;
  let skipped = 0;
  const user = currentUser();

  for (const raw of rows) {
    const r: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw)) {
      const key = normKey(k);
      if (key) r[key] = v == null ? "" : String(v instanceof Date ? v.toISOString() : v).trim();
    }
    if (!r.assetTag || !r.name) {
      skipped++;
      continue;
    }

    // Resolve / create category
    const catKey = (r.category || "").trim();
    let catId: number | undefined;
    if (catKey) {
      const found = catByCode.get(catKey.toLowerCase()) || catByName.get(catKey.toLowerCase());
      if (found) {
        catId = found.id;
      } else {
        const code = catKey.toUpperCase().slice(0, 12);
        const [created] = await db
          .insert(categories)
          .values({ code, name: catKey })
          .returning();
        catByCode.set(code.toLowerCase(), created);
        catByName.set(catKey.toLowerCase(), created);
        catId = created.id;
      }
    }
    if (!catId) {
      // fall back to / create an "Uncategorised" bucket
      let unc = catByCode.get("gen");
      if (!unc) {
        const [created] = await db.insert(categories).values({ code: "GEN", name: "General" }).returning();
        catByCode.set("gen", created);
        unc = created;
      }
      catId = unc.id;
    }

    const acqDate = toISO(raw["acquisitionDate"] ?? r.acquisitionDate ?? "") || toISO(r.acquisitionDate);
    const values = {
      assetTag: r.assetTag,
      name: r.name,
      description: r.description || null,
      categoryId: catId,
      location: r.location || null,
      custodian: r.custodian || null,
      department: r.department || null,
      supplier: r.supplier || null,
      invoiceNo: r.invoiceNo || null,
      serialNo: r.serialNo || null,
      acquisitionDate: acqDate || new Date().toISOString().slice(0, 10),
      cost: String(num(r.cost)),
      residualValue: String(num(r.residualValue)),
      method: methodOf(r.method),
      rate: String(num(r.rate)),
      usefulLife: Math.round(num(r.usefulLife)),
      accumulatedDepreciation: String(num(r.accumulatedDepreciation)),
      depreciationStart: toISO(r.depreciationStart) || acqDate || null,
    };

    const existingId = assetByTag.get(r.assetTag.toLowerCase());
    if (existingId) {
      await db.update(assets).set({ ...values, updatedAt: new Date() }).where(eq(assets.id, existingId));
      updated++;
    } else {
      const [ins] = await db.insert(assets).values({ ...values, status: "ACTIVE" }).returning({ id: assets.id });
      assetByTag.set(r.assetTag.toLowerCase(), ins.id);
      imported++;
    }
  }

  await logActivity({
    action: "ASSETS_IMPORTED",
    entityType: "ASSET",
    summary: `Imported assets from "${(file as File).name}": ${imported} added, ${updated} updated, ${skipped} skipped`,
    details: { imported, updated, skipped },
    user,
  });

  revalidatePath("/assets");
  revalidatePath("/");
  redirect(`/import?ok=${imported}&upd=${updated}&skip=${skipped}`);
}
