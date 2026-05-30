import { NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { db } from "@/db";
import { disposals } from "@/db/schema";
import { desc } from "drizzle-orm";
import { getAssetsWithCategory, categorySummary } from "@/lib/queries";
import { num, round2, DISPOSAL_METHOD_LABELS } from "@/lib/format";

export const dynamic = "force-dynamic";

function xlsxResponse(ws: XLSX.WorkSheet, sheetName: string, fileName: string) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as Uint8Array;
  const body = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  return new Response(body, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const type = sp.get("type") || "summary";
  const stamp = new Date().toISOString().slice(0, 10);

  if (type === "summary") {
    const year = Number(sp.get("year")) || new Date().getUTCFullYear();
    const rows = await getAssetsWithCategory();
    const summary = categorySummary(rows, year);
    const data = summary.map((r, i) => ({
      "#": i + 1,
      Category: r.name,
      Code: r.code,
      "Rate (%)": Number(r.rate),
      "Opening Cost": r.openingCost,
      [`Additions ${year}`]: r.additions,
      Cost: r.cost,
      "Accumulated Depreciation": r.accumDep,
      "Net Book Value": r.nbv,
    }));
    data.push({
      "#": "" as any,
      Category: "TOTAL",
      Code: "",
      "Rate (%)": "" as any,
      "Opening Cost": round2(summary.reduce((a, r) => a + r.openingCost, 0)),
      [`Additions ${year}`]: round2(summary.reduce((a, r) => a + r.additions, 0)),
      Cost: round2(summary.reduce((a, r) => a + r.cost, 0)),
      "Accumulated Depreciation": round2(summary.reduce((a, r) => a + r.accumDep, 0)),
      "Net Book Value": round2(summary.reduce((a, r) => a + r.nbv, 0)),
    });
    return xlsxResponse(XLSX.utils.json_to_sheet(data), "Summary", `PSMS_FAR_Summary_${year}.xlsx`);
  }

  if (type === "disposals") {
    const from = sp.get("from") || "";
    const to = sp.get("to") || "";
    const all = await db.select().from(disposals).orderBy(desc(disposals.disposalDate));
    const rows = all.filter((d) => (!from || d.disposalDate >= from) && (!to || d.disposalDate <= to));
    const data = rows.map((d) => ({
      Reference: d.referenceNo,
      "Asset Tag": d.assetTag,
      "Asset Name": d.assetName,
      Date: d.disposalDate,
      Method: DISPOSAL_METHOD_LABELS[d.method] || d.method,
      "NBV at Disposal": num(d.nbvAtDisposal),
      Proceeds: num(d.proceeds),
      "Gain/(Loss)": num(d.gainLoss),
      Buyer: d.buyer || "",
      Reason: d.reason || "",
    }));
    return xlsxResponse(XLSX.utils.json_to_sheet(data), "Disposals", `PSMS_Disposals_${stamp}.xlsx`);
  }

  // additions
  const year = Number(sp.get("year")) || new Date().getUTCFullYear();
  const month = Number(sp.get("month")) || 0;
  const all = await getAssetsWithCategory();
  const rows = all
    .filter((r) => {
      const d = r.asset.acquisitionDate;
      if (!d) return false;
      return Number(d.slice(0, 4)) === year && (month === 0 || Number(d.slice(5, 7)) === month);
    })
    .sort((a, b) => a.asset.acquisitionDate.localeCompare(b.asset.acquisitionDate));
  const data = rows.map((r) => ({
    "Asset Code": r.asset.assetTag,
    Name: r.asset.name,
    Category: r.category?.name || "",
    Location: r.asset.location || "",
    "Acquired Date": r.asset.acquisitionDate,
    Cost: num(r.asset.cost),
    Supplier: r.asset.supplier || "",
    "Invoice No": r.asset.invoiceNo || "",
  }));
  const suffix = month === 0 ? String(year) : `${year}-${String(month).padStart(2, "0")}`;
  return xlsxResponse(XLSX.utils.json_to_sheet(data), "Additions", `PSMS_Additions_${suffix}.xlsx`);
}
