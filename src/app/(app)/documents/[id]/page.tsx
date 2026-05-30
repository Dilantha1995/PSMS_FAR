import { DocumentSheet } from "@/components/DocumentSheet";
import { PrintBar } from "@/components/PrintBar";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { fmtMVR, fmtDate, DISPOSAL_METHOD_LABELS } from "@/lib/format";

export const dynamic = "force-dynamic";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <tr>
      <td style={{ padding: "5px 10px", width: "38%", color: "#555", verticalAlign: "top", fontSize: 12 }}>{label}</td>
      <td style={{ padding: "5px 10px", color: "#111", fontWeight: 500, fontSize: 12 }}>{value ?? "—"}</td>
    </tr>
  );
}

function SignBlock() {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 64, gap: 32 }}>
      {["Prepared By", "Approved By", "Received By"].map((l) => (
        <div key={l} style={{ flex: 1, textAlign: "center" }}>
          <div style={{ borderTop: "1px solid #333", paddingTop: 6, fontSize: 11, color: "#555" }}>{l}</div>
          <div style={{ fontSize: 10, color: "#999", marginTop: 3 }}>Name / Signature / Date</div>
        </div>
      ))}
    </div>
  );
}

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  border: "1px solid #e2e8f0",
};

export default async function DocumentView({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const [doc] = await db.select().from(documents).where(eq(documents.id, id));
  if (!doc) notFound();
  const p = doc.payload as any;
  const isDisposal = p.kind === "DISPOSAL";
  const gl = Number(p.gainLoss || 0);

  return (
    <div className="py-8 px-4">
      <PrintBar backHref="/documents" />

      <DocumentSheet referenceNo={doc.referenceNo} page={1} pages={doc.pageCount}>
        <div style={{ textAlign: "center", margin: "8px 0 4px" }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#111", letterSpacing: 0.5 }}>
            {isDisposal ? "ASSET DISPOSAL NOTE" : "ASSET TRANSFER NOTE"}
          </h1>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, margin: "12px 0 18px" }}>
          <div>
            <strong>Reference:</strong> {doc.referenceNo}
          </div>
          <div>
            <strong>Date:</strong> {fmtDate(isDisposal ? p.disposalDate : p.transferDate)}
          </div>
        </div>

        <table style={tableStyle}>
          <tbody>
            <Row label="Asset Tag" value={p.assetTag} />
            <Row label="Asset Name" value={p.assetName} />
            {p.serialNo && <Row label="Serial Number" value={p.serialNo} />}
            <Row label="Category" value={p.category} />
            {isDisposal ? (
              <>
                <Row label="Acquisition Date" value={fmtDate(p.acquisitionDate)} />
                <Row label="Disposal Date" value={fmtDate(p.disposalDate)} />
                <Row label="Disposal Method" value={DISPOSAL_METHOD_LABELS[p.method] || p.method} />
                {p.buyer && <Row label="Buyer / Recipient" value={p.buyer} />}
              </>
            ) : (
              <>
                <Row label="Transfer Date" value={fmtDate(p.transferDate)} />
                <Row
                  label="From (Location / Dept / Custodian)"
                  value={`${p.from?.location || "—"} / ${p.from?.department || "—"} / ${p.from?.custodian || "—"}`}
                />
                <Row
                  label="To (Location / Dept / Custodian)"
                  value={`${p.to?.location || "—"} / ${p.to?.department || "—"} / ${p.to?.custodian || "—"}`}
                />
                <Row label="Transfer Type" value={p.external ? "External (leaves company)" : "Internal"} />
              </>
            )}
            {p.reason && <Row label="Reason / Remarks" value={p.reason} />}
          </tbody>
        </table>

        {isDisposal && (
          <>
            <h3 style={{ fontSize: 13, fontWeight: 700, margin: "20px 0 8px", color: "#111" }}>
              Financial Summary (MVR)
            </h3>
            <table style={tableStyle}>
              <tbody>
                <Row label="Original Cost" value={fmtMVR(p.cost, false)} />
                <Row label="Accumulated Depreciation" value={fmtMVR(p.accumDep, false)} />
                <Row label="Net Book Value at Disposal" value={fmtMVR(p.nbv, false)} />
                <Row label="Disposal Proceeds" value={fmtMVR(p.proceeds, false)} />
                <Row
                  label={gl < 0 ? "Loss on Disposal" : "Gain on Disposal"}
                  value={<span style={{ color: gl < 0 ? "#dc2626" : "#5a8a1f" }}>{fmtMVR(Math.abs(gl), false)}</span>}
                />
              </tbody>
            </table>
          </>
        )}

        <SignBlock />
      </DocumentSheet>
    </div>
  );
}
