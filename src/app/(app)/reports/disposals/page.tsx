import { DocumentSheet } from "@/components/DocumentSheet";
import { ReportToolbar } from "@/components/ReportToolbar";
import { db } from "@/db";
import { disposals } from "@/db/schema";
import { desc } from "drizzle-orm";
import { fmtMVR, fmtDate, todayISO, DISPOSAL_METHOD_LABELS } from "@/lib/format";

export const dynamic = "force-dynamic";

const thr: React.CSSProperties = { padding: "6px 8px", textAlign: "right", borderBottom: "1.5px solid #1b75bb" };
const thl: React.CSSProperties = { padding: "6px 8px", textAlign: "left", borderBottom: "1.5px solid #1b75bb" };
const tdr: React.CSSProperties = { padding: "5px 8px", textAlign: "right", borderBottom: "1px solid #eee" };
const tdl: React.CSSProperties = { padding: "5px 8px", textAlign: "left", borderBottom: "1px solid #eee" };

export default async function DisposalReport({ searchParams }: { searchParams: { from?: string; to?: string } }) {
  const all = await db.select().from(disposals).orderBy(desc(disposals.disposalDate));
  const from = searchParams.from || "";
  const to = searchParams.to || "";
  const rows = all.filter((d) => (!from || d.disposalDate >= from) && (!to || d.disposalDate <= to));

  const tot = rows.reduce(
    (a, d) => ({
      nbv: a.nbv + Number(d.nbvAtDisposal),
      proceeds: a.proceeds + Number(d.proceeds),
      gl: a.gl + Number(d.gainLoss),
    }),
    { nbv: 0, proceeds: 0, gl: 0 }
  );

  const period = from || to ? `${from ? fmtDate(from) : "start"} – ${to ? fmtDate(to) : "today"}` : "All dates";

  return (
    <div className="py-8 px-4">
      <div className="no-print max-w-[210mm] mx-auto mb-3">
        <form method="get" className="flex flex-wrap items-end gap-2 text-sm">
          <label className="flex flex-col">
            <span className="text-slate-600 mb-1">From</span>
            <input type="date" name="from" defaultValue={from} className="rounded-md border border-slate-300 px-3 py-1.5 bg-white" />
          </label>
          <label className="flex flex-col">
            <span className="text-slate-600 mb-1">To</span>
            <input type="date" name="to" defaultValue={to} className="rounded-md border border-slate-300 px-3 py-1.5 bg-white" />
          </label>
          <button className="bg-slate-700 text-white rounded-md px-3 py-1.5">Apply</button>
        </form>
      </div>

      <ReportToolbar backHref="/reports" excelHref={`/api/report?type=disposals&from=${from}&to=${to}&fmt=xlsx`} />

      <DocumentSheet metaText={`Generated on ${fmtDate(todayISO())}`}>
        <div style={{ textAlign: "center", marginBottom: 4 }}>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: "#1f3a5f" }}>Fixed Asset Disposal Report</h1>
          <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>Period: {period}</div>
        </div>

        {rows.length === 0 ? (
          <p style={{ textAlign: "center", color: "#888", marginTop: 30 }}>No disposals recorded for this period.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10.5, marginTop: 14 }}>
            <thead>
              <tr style={{ color: "#1f3a5f", fontWeight: 700 }}>
                <th style={thl}>Reference</th>
                <th style={thl}>Asset</th>
                <th style={thl}>Date</th>
                <th style={thl}>Method</th>
                <th style={thr}>NBV</th>
                <th style={thr}>Proceeds</th>
                <th style={thr}>Gain / (Loss)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => {
                const gl = Number(d.gainLoss);
                return (
                  <tr key={d.id}>
                    <td style={{ ...tdl, fontFamily: "monospace", fontSize: 9.5 }}>{d.referenceNo}</td>
                    <td style={tdl}>
                      <div style={{ fontWeight: 600 }}>{d.assetTag}</div>
                      <div style={{ color: "#888", fontSize: 9 }}>{d.assetName}</div>
                    </td>
                    <td style={tdl}>{fmtDate(d.disposalDate)}</td>
                    <td style={tdl}>{DISPOSAL_METHOD_LABELS[d.method] || d.method}</td>
                    <td style={tdr}>{fmtMVR(d.nbvAtDisposal, false)}</td>
                    <td style={tdr}>{fmtMVR(d.proceeds, false)}</td>
                    <td style={{ ...tdr, color: gl < 0 ? "#dc2626" : "#2f7d32" }}>{fmtMVR(d.gainLoss, false)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: 700, color: "#1f3a5f", background: "#eef4fb" }}>
                <td style={{ ...tdl, borderTop: "1.5px solid #1b75bb" }} colSpan={4}>
                  TOTAL ({rows.length})
                </td>
                <td style={{ ...tdr, borderTop: "1.5px solid #1b75bb" }}>{fmtMVR(tot.nbv, false)}</td>
                <td style={{ ...tdr, borderTop: "1.5px solid #1b75bb" }}>{fmtMVR(tot.proceeds, false)}</td>
                <td style={{ ...tdr, borderTop: "1.5px solid #1b75bb", color: tot.gl < 0 ? "#dc2626" : "#2f7d32" }}>
                  {fmtMVR(tot.gl, false)}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
        <p style={{ fontSize: 10, color: "#888", marginTop: 16 }}>Amounts in Maldivian Rufiyaa (MVR).</p>
      </DocumentSheet>
    </div>
  );
}
