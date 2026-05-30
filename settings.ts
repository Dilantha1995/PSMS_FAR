import { PageHeader, StatCard, Card, Btn } from "@/components/ui";
import { getAssetsWithCategory, computeTotals, breakdownByCategory } from "@/lib/queries";
import { recentActivity } from "@/lib/activity";
import { fmtMVR, fmtDateTime } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  let rows: Awaited<ReturnType<typeof getAssetsWithCategory>> = [];
  let activity: Awaited<ReturnType<typeof recentActivity>> = [];
  let dbError = false;
  try {
    [rows, activity] = await Promise.all([getAssetsWithCategory(), recentActivity(12)]);
  } catch (e) {
    dbError = true;
  }

  const totals = computeTotals(rows as any);
  const breakdown = breakdownByCategory(rows as any);
  const maxCost = Math.max(1, ...breakdown.map((b) => b.cost));

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Dashboard"
        subtitle="Fixed Asset Register — Pro Synergy Medical Systems Pvt Ltd"
        action={<Btn href="/assets/new">+ Add Asset</Btn>}
      />

      {dbError && (
        <Card className="p-4 mb-6 border-amber-300 bg-amber-50">
          <div className="text-sm text-amber-800">
            Could not reach the database. Make sure <code className="font-mono">DATABASE_URL</code> is configured
            and the schema has been pushed (<code className="font-mono">npm run db:push</code>).
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <StatCard label="Total Assets" value={String(totals.count)} accent="blue" />
        <StatCard label="Active" value={String(totals.active)} accent="green" />
        <StatCard label="Total Cost" value={fmtMVR(totals.totalCost)} accent="slate" />
        <StatCard label="Accum. Depreciation" value={fmtMVR(totals.totalAccumDep)} accent="orange" />
        <StatCard label="Net Book Value" value={fmtMVR(totals.totalNbv)} accent="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Cost by Category</h2>
          {breakdown.length === 0 ? (
            <p className="text-sm text-slate-400">No assets yet.</p>
          ) : (
            <div className="space-y-3">
              {breakdown.map((b) => (
                <div key={b.code}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-700">
                      {b.code} <span className="text-slate-400">· {b.count}</span>
                    </span>
                    <span className="text-slate-500">{fmtMVR(b.cost, false)}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded">
                    <div
                      className="h-2 bg-brand-green rounded"
                      style={{ width: `${(b.cost / maxCost) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Recent Activity</h2>
            <Link href="/activity" className="text-xs text-brand-blue hover:underline">
              View all
            </Link>
          </div>
          {activity.length === 0 ? (
            <p className="text-sm text-slate-400">No activity recorded yet.</p>
          ) : (
            <ul className="space-y-3">
              {activity.map((a) => (
                <li key={a.id} className="text-sm border-b border-slate-100 pb-2 last:border-0">
                  <div className="text-slate-700">{a.summary}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {a.user} · {fmtDateTime(a.createdAt)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
