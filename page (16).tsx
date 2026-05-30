import { db } from "@/db";
import { assets, categories, locations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { fmtMVR, fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PublicAsset({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!id) notFound();
  const [a] = await db.select().from(assets).where(eq(assets.id, id));
  if (!a) notFound();
  const [cat] = a.categoryId ? await db.select().from(categories).where(eq(categories.id, a.categoryId)) : [];
  const [loc] = a.locationId ? await db.select().from(locations).where(eq(locations.id, a.locationId)) : [];

  const year = a.acquisitionDate ? a.acquisitionDate.slice(0, 4) : "—";
  const locationName = loc?.name || a.location || "—";

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #eef2f7" }}>
      <span style={{ color: "#64748b", fontSize: 14 }}>{label}</span>
      <span style={{ color: "#0f172a", fontSize: 14, fontWeight: 600, textAlign: "right", marginLeft: 16 }}>{value}</span>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
      <div style={{ width: "100%", maxWidth: 440, padding: 16 }}>
        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", overflow: "hidden" }}>
          <div style={{ padding: "22px 22px 8px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="ProSynergy" style={{ height: 40, objectFit: "contain" }} />
          </div>
          <div style={{ height: 4, background: "linear-gradient(90deg,#8cc63f,#5a8a1f)" }} />
          <div style={{ padding: 22 }}>
            <div style={{ fontFamily: "monospace", fontSize: 13, color: "#1b75bb", fontWeight: 700 }}>{a.assetTag}</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: "4px 0 16px" }}>{a.name}</h1>
            <Row label="Location" value={locationName} />
            <Row label="Category" value={cat?.name || "—"} />
            <Row label="Acquired Year" value={year} />
            <Row label="Cost (MVR)" value={fmtMVR(a.cost, false)} />
            {a.acquisitionDate && <Row label="Acquisition Date" value={fmtDate(a.acquisitionDate)} />}
          </div>
        </div>
        <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 12, marginTop: 14 }}>
          Pro Synergy Medical Systems Pvt Ltd — Fixed Asset Register
        </p>
      </div>
    </div>
  );
}
