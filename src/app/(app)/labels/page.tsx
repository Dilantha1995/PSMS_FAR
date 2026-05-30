import { PageHeader, Btn } from "@/components/ui";
import { PrintBar } from "@/components/PrintBar";
import { db } from "@/db";
import { assets, categories, locations } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { headers } from "next/headers";
import { getActiveCategories, getActiveLocations } from "@/lib/queries";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

export default async function LabelsPage({
  searchParams,
}: {
  searchParams: { cat?: string; loc?: string; status?: string };
}) {
  const cats = await getActiveCategories();
  const locs = await getActiveLocations();

  // Build filtered asset list
  const conds = [];
  if (searchParams.cat) conds.push(eq(assets.categoryId, Number(searchParams.cat)));
  if (searchParams.loc) conds.push(eq(assets.locationId, Number(searchParams.loc)));
  if (searchParams.status === "active") conds.push(ne(assets.status, "DISPOSED"));
  const rows = await db
    .select({ a: assets, cat: categories, loc: locations })
    .from(assets)
    .leftJoin(categories, eq(assets.categoryId, categories.id))
    .leftJoin(locations, eq(assets.locationId, locations.id))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(assets.assetTag);

  const h = headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "";
  const proto = h.get("x-forwarded-proto") || "https";
  const base = host ? `${proto}://${host}` : "";

  // Generate a QR (data URL) per asset pointing at its public page
  const labels = await Promise.all(
    rows.map(async (r) => ({
      tag: r.a.assetTag,
      name: r.a.name,
      location: r.loc?.name || r.a.location || "",
      qr: await QRCode.toDataURL(`${base}/p/${r.a.id}`, { margin: 0, width: 220, errorCorrectionLevel: "M" }),
    }))
  );

  return (
    <div className="p-8">
      <div className="no-print max-w-5xl mx-auto">
        <PageHeader
          title="Asset Labels"
          subtitle="Print QR labels in bulk — scan to view asset name, location, year and cost"
          action={<Btn href="/assets" variant="secondary">Back</Btn>}
        />
        <form method="get" className="flex flex-wrap items-end gap-3 mb-4 text-sm">
          <label className="flex flex-col">
            <span className="text-slate-600 mb-1">Category</span>
            <select name="cat" defaultValue={searchParams.cat || ""} className="rounded-md border border-slate-300 px-3 py-1.5 bg-white">
              <option value="">All</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col">
            <span className="text-slate-600 mb-1">Location</span>
            <select name="loc" defaultValue={searchParams.loc || ""} className="rounded-md border border-slate-300 px-3 py-1.5 bg-white">
              <option value="">All</option>
              {locs.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.code} — {l.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col">
            <span className="text-slate-600 mb-1">Status</span>
            <select name="status" defaultValue={searchParams.status || ""} className="rounded-md border border-slate-300 px-3 py-1.5 bg-white">
              <option value="">All</option>
              <option value="active">Active only</option>
            </select>
          </label>
          <button className="bg-slate-700 text-white rounded-md px-4 py-1.5">Apply</button>
        </form>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-slate-500">{labels.length} label(s)</span>
        </div>
      </div>

      <PrintBar backHref="/assets" />

      <div className="label-grid">
        {labels.map((l) => (
          <div key={l.tag} className="label-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={l.qr} alt="" className="label-qr" />
            <div className="label-info">
              <div className="label-tag">{l.tag}</div>
              <div className="label-name">{l.name}</div>
              {l.location && <div className="label-loc">{l.location}</div>}
              <div className="label-brand">Pro Synergy Medical Systems</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
