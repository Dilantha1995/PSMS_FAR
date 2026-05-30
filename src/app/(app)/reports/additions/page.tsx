import { DocumentSheet } from "@/components/DocumentSheet";
import { ReportToolbar } from "@/components/ReportToolbar";
import { getAssetsWithCategory } from "@/lib/queries";
import { fmtMVR, fmtDate, todayISO } from "@/lib/format";

export const dynamic = "force-dynamic";

const thr: React.CSSProperties = { padding: "6px 8px", textAlign: "right", borderBottom: "1.5px solid #1b75bb" };
const thl: React.CSSProperties = { padding: "6px 8px", textAlign: "left", borderBottom: "1.5px solid #1b75bb" };
const tdr: React.CSSProperties = { padding: "5px 8px", textAlign: "right", borderBottom: "1px solid #eee" };
const tdl: React.CSSProperties = { padding: "5px 8px", textAlign: "left", borderBottom: "1px solid #eee" };

const MONTHS = ["All months", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default async function AdditionsReport({ searchParams }: { searchParams: { year?: string; month?: string } }) {
  const year = Number(searchParams.year) || new Date().getUTCFullYear();
  const month = Number(searchParams.month) || 0; // 0 = all

  const all = await getAssetsWithCategory();
  const rows = all
    .filter((r) => {
      const d = r.asset.acquisitionDate;
      if (!d) return false;
      const y = Number(d.slice(0, 4));
      const m = Number(d.slice(5, 7));
      return y === year && (month === 0 || m === month);
    })
    .sort((a, b) => a.asset.acquisitionDate.localeCompare(b.asset.acquisitionDate));

  const total = rows.reduce((a, r) => a + Number(r.asset.cost), 0);
  const periodLabel = month === 0 ? `${year}` : `${MONTHS[month]} ${year}`;

  return (
    <div className="py-8 px-4">
      <div className="no-print max-w-[210mm] mx-auto mb-3">
        <form method="get" className="flex flex-wrap items-end gap-2 text-sm">
          <label className="flex flex-col">
            <span className="text-slate-600 mb-1">Year</span>
            <select name="year" defaultValue={String(year)} className="rounded-md border border-slate-300 px-3 py-1.5 bg-white">
              {Array.from({ length: 12 }, (_, i) => new Date().getUTCFullYear() - i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col">
            <span className="text-slate-600 mb-1">Month</span>
            <select name="month" defaultValue={String(month)} className="rounded-md border border-slate-300 px-3 py-1.5 bg-white">
              {MONTHS.map((m, i) => (
                <option key={i} value={i}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <button className="bg-slate-700 text-white rounded-md px-3 py-1.5">Apply</button>
        </form>
      </div>

      <ReportToolbar backHref="/reports" excelHref={`/api/report?type=additions&year=${year}&month=${month}&fmt=xlsx`} />

      <DocumentSheet metaText={`Generated on ${fmtDate(todayISO())}`}>
        <div style={{ textAlign: "center", marginBottom: 4 }}>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: "#1f3a5f" }}>Fixed Asset Addition Report</h1>
          <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>Period: {periodLabel}</div>
        </div>

        {rows.length === 0 ? (
          <p style={{ textAlign: "center", color: "#888", marginTop: 30 }}>No additions in this period.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10.5, marginTop: 14 }}>
            <thead>
              <tr style={{ color: "#1f3a5f", fontWeight: 700 }}>
                <th style={thl}>Asset Code</th>
                <th style={thl}>Name</th>
                <th style={thl}>Category</th>
                <th style={thl}>Acquired</th>
                <th style={thr}>Cost</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.asset.id}>
                  <td style={{ ...tdl, fontFamily: "monospace", fontSize: 9.5 }}>{r.asset.assetTag}</td>
                  <td style={tdl}>{r.asset.name}</td>
                  <td style={tdl}>{r.category?.name || "—"}</td>
                  <td style={tdl}>{fmtDate(r.asset.acquisitionDate)}</td>
                  <td style={tdr}>{fmtMVR(r.asset.cost, false)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: 700, color: "#1f3a5f", background: "#eef4fb" }}>
                <td style={{ ...tdl, borderTop: "1.5px solid #1b75bb" }} colSpan={4}>
                  TOTAL ({rows.length} assets)
                </td>
                <td style={{ ...tdr, borderTop: "1.5px solid #1b75bb" }}>{fmtMVR(total, false)}</td>
              </tr>
            </tfoot>
          </table>
        )}
        <p style={{ fontSize: 10, color: "#888", marginTop: 16 }}>Amounts in Maldivian Rufiyaa (MVR).</p>
      </DocumentSheet>
    </div>
  );
}
