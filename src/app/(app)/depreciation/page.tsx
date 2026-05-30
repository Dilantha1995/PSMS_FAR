import { PageHeader, Card, Btn, Field, StatusBadge, Empty } from "@/components/ui";
import { createRun } from "@/lib/actions/depreciation";
import { db } from "@/db";
import { depreciationRuns } from "@/db/schema";
import { desc } from "drizzle-orm";
import { fmtMVR, fmtDate, todayISO } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DepreciationPage() {
  const runs = await db.select().from(depreciationRuns).orderBy(desc(depreciationRuns.createdAt));

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
  const monthLabel = now.toLocaleString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <PageHeader title="Depreciation" subtitle="Compute and record depreciation for a period" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            {runs.length === 0 ? (
              <Empty message="No depreciation runs yet. Create one for a period on the right." />
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Period</th>
                    <th className="px-4 py-3 font-medium">Range</th>
                    <th className="px-4 py-3 font-medium text-right">Assets</th>
                    <th className="px-4 py-3 font-medium text-right">Depreciation</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {runs.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link href={`/depreciation/${r.id}`} className="text-brand-blue hover:underline font-medium">
                          {r.label}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        {fmtDate(r.periodStart)} – {fmtDate(r.periodEnd)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{r.assetCount}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{fmtMVR(r.totalDepreciation, false)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        <Card className="p-5 h-fit">
          <h3 className="font-semibold text-slate-800 mb-4">New Depreciation Run</h3>
          <form action={createRun} className="space-y-4">
            <Field label="Period Label" name="label" required defaultValue={monthLabel} />
            <Field label="Period Start" name="periodStart" type="date" required defaultValue={monthStart} />
            <Field label="Period End" name="periodEnd" type="date" required defaultValue={monthEnd} />
            <Field label="Notes" name="notes" type="textarea" />
            <Btn type="submit">Compute Draft</Btn>
          </form>
          <p className="text-xs text-slate-400 mt-3">
            A draft is calculated for all active assets over the period. Review the lines, then post it to record the
            depreciation against accumulated depreciation.
          </p>
        </Card>
      </div>
    </div>
  );
}
