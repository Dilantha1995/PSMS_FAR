import { DocumentSheet } from "@/components/DocumentSheet";
import { ReportToolbar } from "@/components/ReportToolbar";
import { getAssetsWithCategory, categorySummary } from "@/lib/queries";
import { fmtMVR, fmtDate, todayISO } from "@/lib/format";

export const dynamic = "force-dynamic";

const thr: React.CSSProperties = { padding: "6px 8px", textAlign: "right", borderBottom: "1.5px solid #1b75bb" };
const thl: React.CSSProperties = { padding: "6px 8px", textAlign: "left", borderBottom: "1.5px solid #1b75bb" };
const tdr: React.CSSProperties = { padding: "5px 8px", textAlign: "right", borderBottom: "1px solid #eee" };
const tdl: React.CSSProperties = { padding: "5px 8px", textAlign: "left", borderBottom: "1px solid #eee" };

export default async function SummaryReport({ searchParams }: { searchParams: { year?: string } }) {
  const year = Number(searchParams.year) || new Date().getUTCFullYear();
  const rows = await getAssetsWithCategory();
  const summary = categorySummary(rows, year);

  const tot = summary.reduce(
    (a, r) => ({
      count: a.count + r.count,
      opening: a.opening + r.openingCost,
      additions: a.additions + r.additions,
      cost: a.cost + r.cost,
      accum: a.accum + r.accumDep,
      nbv: a.nbv + r.nbv,
    }),
    { count: 0, opening: 0, additions: 0, cost: 0, accum: 0, nbv: 0 }
  );

  return (
    <div className="py-8 px-4">
      <div className="no-print max-w-[210mm] mx-auto mb-3">
        <form method="get" className="flex items-center gap-2">
          <label className="text-sm text-slate-600">Year</label>
          <select name="year" defaultValue={String(year)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm bg-white">
            {Array.from({ length: 8 }, (_, i) => new Date().getUTCFullYear() - i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button className="bg-slate-700 text-white rounded-md px-3 py-1.5 text-sm">Apply</button>
        </form>
      </div>

      <ReportToolbar backHref="/reports" excelHref={`/api/report?type=summary&year=${year}&fmt=xlsx`} />

      <DocumentSheet metaText={`Generated on ${fmtDate(todayISO())}`}>
        <div style={{ textAlign: "center", marginBottom: 4 }}>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: "#1f3a5f" }}>Fixed Assets Registry — Summary</h1>
          <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>As of {fmtDate(todayISO())}</div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, marginTop: 14 }}>
          <thead>
            <tr style={{ color: "#1f3a5f", fontWeight: 700 }}>
              <th style={{ ...thl, width: 24 }}>#</th>
              <th style={thl}>Fixed Asset Category</th>
              <th style={{ ...thr, width: 52 }}>Rate</th>
              <th style={thr}>Opening Cost</th>
              <th style={thr}>Additions ({year})</th>
              <th style={thr}>Cost</th>
              <th style={thr}>Accum. Dep</th>
              <th style={thr}>Net Book Value</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((r, i) => (
              <tr key={r.code}>
                <td style={tdl}>{i + 1}</td>
                <td style={tdl}>
                  <span style={{ fontWeight: 600 }}>{r.name}</span>
                  <span style={{ color: "#999", marginLeft: 6 }}>({r.code})</span>
                </td>
                <td style={tdr}>{Number(r.rate)}%</td>
                <td style={tdr}>{fmtMVR(r.openingCost, false)}</td>
                <td style={tdr}>{r.additions ? fmtMVR(r.additions, false) : "—"}</td>
                <td style={tdr}>{fmtMVR(r.cost, false)}</td>
                <td style={tdr}>{fmtMVR(r.accumDep, false)}</td>
                <td style={tdr}>{fmtMVR(r.nbv, false)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ fontWeight: 700, color: "#1f3a5f", background: "#eef4fb" }}>
              <td style={{ ...tdl, borderTop: "1.5px solid #1b75bb" }} colSpan={3}>
                TOTAL
              </td>
              <td style={{ ...tdr, borderTop: "1.5px solid #1b75bb" }}>{fmtMVR(tot.opening, false)}</td>
              <td style={{ ...tdr, borderTop: "1.5px solid #1b75bb" }}>{fmtMVR(tot.additions, false)}</td>
              <td style={{ ...tdr, borderTop: "1.5px solid #1b75bb" }}>{fmtMVR(tot.cost, false)}</td>
              <td style={{ ...tdr, borderTop: "1.5px solid #1b75bb" }}>{fmtMVR(tot.accum, false)}</td>
              <td style={{ ...tdr, borderTop: "1.5px solid #1b75bb" }}>{fmtMVR(tot.nbv, false)}</td>
            </tr>
          </tfoot>
        </table>

        <p style={{ fontSize: 10, color: "#888", marginTop: 16 }}>
          MVR. Opening Cost = assets acquired before {year}; Additions = assets acquired during {year}. Currency: Maldivian
          Rufiyaa.
        </p>
      </DocumentSheet>
    </div>
  );
}
