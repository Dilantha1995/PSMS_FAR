import { DocumentSheet } from "@/components/DocumentSheet";
import { ReportToolbar } from "@/components/ReportToolbar";
import { depreciationMovement } from "@/lib/queries";
import { fmtMVR, fmtDate, todayISO } from "@/lib/format";

export const dynamic = "force-dynamic";

const thr: React.CSSProperties = { padding: "6px 8px", textAlign: "right", borderBottom: "1.5px solid #1b75bb" };
const thl: React.CSSProperties = { padding: "6px 8px", textAlign: "left", borderBottom: "1.5px solid #1b75bb" };
const tdr: React.CSSProperties = { padding: "5px 8px", textAlign: "right", borderBottom: "1px solid #eee" };
const tdl: React.CSSProperties = { padding: "5px 8px", textAlign: "left", borderBottom: "1px solid #eee" };
const MONTHS = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default async function DepreciationReport({ searchParams }: { searchParams: { year?: string; month?: string } }) {
  const now = new Date();
  const year = Number(searchParams.year) || now.getUTCFullYear();
  const month = Number(searchParams.month) || now.getUTCMonth() + 1;
  const { rows, hasRun } = await depreciationMovement(year, month);

  const tot = rows.reduce(
    (a, r) => ({
      opening: a.opening + r.opening,
      charge: a.charge + r.charge,
      disposal: a.disposal + r.disposal,
      closing: a.closing + r.closing,
    }),
    { opening: 0, charge: 0, disposal: 0, closing: 0 }
  );

  return (
    <div className="py-8 px-4">
      <div className="no-print max-w-[210mm] mx-auto mb-3">
        <form method="get" className="flex flex-wrap items-end gap-2 text-sm">
          <label className="flex flex-col">
            <span className="text-slate-600 mb-1">Month</span>
            <select name="month" defaultValue={String(month)} className="rounded-md border border-slate-300 px-3 py-1.5 bg-white">
              {MONTHS.slice(1).map((m, i) => (
                <option key={i + 1} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col">
            <span className="text-slate-600 mb-1">Year</span>
            <select name="year" defaultValue={String(year)} className="rounded-md border border-slate-300 px-3 py-1.5 bg-white">
              {Array.from({ length: 8 }, (_, i) => now.getUTCFullYear() - i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
          <button className="bg-slate-700 text-white rounded-md px-3 py-1.5">Apply</button>
        </form>
        {!hasRun && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mt-2">
            No depreciation has been posted for {MONTHS[month]} {year}. Post it in the Depreciation module to populate
            the monthly charge. Any disposals in the month are still shown.
          </p>
        )}
      </div>

      <ReportToolbar backHref="/reports" excelHref={`/api/report?type=depreciation&year=${year}&month=${month}&fmt=xlsx`} />

      <DocumentSheet metaText={`Generated on ${fmtDate(todayISO())}`}>
        <div style={{ textAlign: "center", marginBottom: 4 }}>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: "#1f3a5f" }}>Depreciation Report</h1>
          <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>
            Accumulated Depreciation Movement — {MONTHS[month]} {year}
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, marginTop: 14 }}>
          <thead>
            <tr style={{ color: "#1f3a5f", fontWeight: 700 }}>
              <th style={thl}>Fixed Asset Category</th>
              <th style={thr}>Opening Accum. Dep</th>
              <th style={thr}>Depreciation for Month</th>
              <th style={thr}>Less: Disposal Dep</th>
              <th style={thr}>Closing Accum. Dep</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td style={tdl} colSpan={5}>
                  No data for this period.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.code}>
                  <td style={tdl}>
                    <span style={{ fontWeight: 600 }}>{r.name}</span>
                    <span style={{ color: "#999", marginLeft: 6 }}>({r.code})</span>
                  </td>
                  <td style={tdr}>{fmtMVR(r.opening, false)}</td>
                  <td style={tdr}>{fmtMVR(r.charge, false)}</td>
                  <td style={tdr}>{r.disposal ? `(${fmtMVR(r.disposal, false)})` : "—"}</td>
                  <td style={tdr}>{fmtMVR(r.closing, false)}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr style={{ fontWeight: 700, color: "#1f3a5f", background: "#eef4fb" }}>
              <td style={{ ...tdl, borderTop: "1.5px solid #1b75bb" }}>TOTAL</td>
              <td style={{ ...tdr, borderTop: "1.5px solid #1b75bb" }}>{fmtMVR(tot.opening, false)}</td>
              <td style={{ ...tdr, borderTop: "1.5px solid #1b75bb" }}>{fmtMVR(tot.charge, false)}</td>
              <td style={{ ...tdr, borderTop: "1.5px solid #1b75bb" }}>{tot.disposal ? `(${fmtMVR(tot.disposal, false)})` : "—"}</td>
              <td style={{ ...tdr, borderTop: "1.5px solid #1b75bb" }}>{fmtMVR(tot.closing, false)}</td>
            </tr>
          </tfoot>
        </table>

        <p style={{ fontSize: 10, color: "#888", marginTop: 16 }}>
          Opening + Depreciation for the month − Depreciation on disposals = Closing. Amounts in MVR.
        </p>
      </DocumentSheet>
    </div>
  );
}
