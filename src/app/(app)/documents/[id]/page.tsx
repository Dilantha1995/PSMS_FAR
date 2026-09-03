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

function SignBlock({ labels = ["Prepared By", "Approved By", "Received By"] }: { labels?: string[] }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 64, gap: 32 }}>
      {labels.map((l) => (
        <div key={l} style={{ flex: 1, textAlign: "center" }}>
          <div style={{ borderTop: "1px solid #333", paddingTop: 6, fontSize: 11, color: "#555" }}>{l}</div>
          <div style={{ fontSize: 10, color: "#999", marginTop: 3 }}>Name / Signature / Date</div>
        </div>
      ))}
    </div>
  );
}

function InfoBox({ title, rows }: { title: string; rows: [string, React.ReactNode][] }) {
  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 6, background: "#f8fafc", padding: "10px 14px", margin: "0 0 14px" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#111", marginBottom: 6 }}>{title}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 24px" }}>
        {rows.map(([label, value]) => (
          <div key={label} style={{ fontSize: 12 }}>
            <span style={{ color: "#555" }}>{label}: </span>
            <span style={{ fontWeight: 600, color: "#111" }}>{value ?? "—"}</span>
          </div>
        ))}
      </div>
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
      <PrintBar backHref="/documents" pdfHref={`/api/documents/${doc.id}/pdf`} />

      {p.manual && (
        <div className="no-print max-w-[210mm] mx-auto mb-4 rounded-md bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-800">
          This note was generated manually — the asset is not recorded in the FAR.
        </div>
      )}

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

        {!isDisposal && (
          <>
            <InfoBox
              title="Receiving Person"
              rows={[
                ["Name", p.to?.custodian || "—"],
                ["Designation", p.to?.designation || "—"],
                ["Department", p.to?.department || "—"],
                ["Location", p.to?.location || "—"],
              ]}
            />
            <p style={{ fontSize: 12, color: "#333", lineHeight: 1.5, margin: "0 0 14px" }}>
              Dear {p.to?.custodian || "Recipient"}, please find below the asset(s) handed over to you for
              official use. Kindly utilize and safeguard the item(s) responsibly.
            </p>
          </>
        )}

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

        <SignBlock
          labels={isDisposal ? ["Prepared By", "Approved By", "Received By"] : ["Prepared By", "Checked By", "Approved By", "Handed Over By"]}
        />

        {!isDisposal && (
          <div style={{ marginTop: 28, borderTop: "1px solid #e2e8f0", paddingTop: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#111", marginBottom: 4 }}>ACKNOWLEDGMENT</div>
            <p style={{ fontSize: 11, color: "#333", fontStyle: "italic", lineHeight: 1.5, margin: "0 0 20px" }}>
              By signing below, I acknowledge that the asset(s) listed above have been handed over to me and are
              my responsibility until they are returned. I understand that if they are lost, stolen, or damaged
              while in my care, I will be held responsible for their repair or replacement.
            </p>
            <div style={{ width: "45%" }}>
              <div style={{ borderTop: "1px solid #333", paddingTop: 6, fontSize: 11, color: "#555" }}>
                Acknowledged &amp; Received By
              </div>
              <div style={{ fontSize: 10, color: "#999", marginTop: 3 }}>Name / Signature / Date</div>
            </div>
          </div>
        )}
      </DocumentSheet>
    </div>
  );
}
