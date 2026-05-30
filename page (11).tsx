import { NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { getAssetsWithCategory } from "@/lib/queries";
import { num, round2 } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const fmt = sp.get("fmt") === "csv" ? "csv" : "xlsx";
  const q = (sp.get("q") || "").toLowerCase();
  const status = sp.get("status") || "";
  const cat = sp.get("cat") || "";

  const rows = await getAssetsWithCategory();
  const filtered = rows.filter((r) => {
    if (status && r.asset.status !== status) return false;
    if (cat && String(r.asset.categoryId) !== cat) return false;
    if (q) {
      const hay = `${r.asset.assetTag} ${r.asset.name} ${r.asset.serialNo || ""} ${r.asset.location || ""} ${
        r.asset.custodian || ""
      }`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const data = filtered.map((r) => {
    const cost = num(r.asset.cost);
    const accum = num(r.asset.accumulatedDepreciation);
    return {
      "Asset Tag": r.asset.assetTag,
      Name: r.asset.name,
      Category: r.category ? `${r.category.code} — ${r.category.name}` : "",
      Description: r.asset.description || "",
      Location: r.asset.location || "",
      Department: r.asset.department || "",
      Custodian: r.asset.custodian || "",
      Supplier: r.asset.supplier || "",
      "Invoice No": r.asset.invoiceNo || "",
      "Serial No": r.asset.serialNo || "",
      "Acquisition Date": r.asset.acquisitionDate,
      "Depreciation Start": r.asset.depreciationStart || "",
      Method: r.asset.method,
      "Rate (%)": num(r.asset.rate),
      "Useful Life (yrs)": r.asset.usefulLife || "",
      Cost: cost,
      "Residual Value": num(r.asset.residualValue),
      "Accumulated Depreciation": accum,
      "Net Book Value": round2(cost - accum),
      Status: r.asset.status,
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const stamp = new Date().toISOString().slice(0, 10);

  if (fmt === "csv") {
    const csv = XLSX.utils.sheet_to_csv(ws);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="PSMS_FAR_${stamp}.csv"`,
      },
    });
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "FAR");
  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as Uint8Array;
  const body = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  return new Response(body, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="PSMS_FAR_${stamp}.xlsx"`,
    },
  });
}
