import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { assets } from "@/db/schema";
import { getCodingSettings, buildCode } from "@/lib/settings";

export const dynamic = "force-dynamic";

// Suggests the next sequential asset code for a MAIN/SUB/LOC combination.
// Scans existing asset tags (splitting on / or -) so numbering continues from
// imported/legacy assets regardless of the configured prefix or separator.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const cat = (sp.get("cat") || "").trim().toUpperCase();
  const sub = (sp.get("sub") || "").trim().toUpperCase();
  const loc = (sp.get("loc") || "").trim().toUpperCase();

  if (!cat || !sub || !loc) {
    return NextResponse.json({ code: "", next: 0, error: "cat, sub and loc are required" }, { status: 400 });
  }

  const cfg = await getCodingSettings();
  const rows = await db.select({ tag: assets.assetTag }).from(assets);
  let max = 0;
  for (const { tag } of rows) {
    const parts = tag.split(/[\/\-]/);
    if (parts.length < 4) continue;
    const [mc, snc, lc, seq] = parts.slice(-4);
    if (mc.toUpperCase() === cat && snc.toUpperCase() === sub && lc.toUpperCase() === loc) {
      const n = parseInt(String(seq).replace(/\D/g, ""), 10);
      if (!isNaN(n) && n > max) max = n;
    }
  }
  const next = max + 1;
  return NextResponse.json({ code: buildCode(cfg, cat, sub, loc, next), next });
}
