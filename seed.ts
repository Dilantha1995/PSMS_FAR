import { PageHeader, Card, Empty } from "@/components/ui";
import { db } from "@/db";
import { adjustments } from "@/db/schema";
import { desc } from "drizzle-orm";
import { fmtMVR, fmtDate, ADJUSTMENT_TYPE_LABELS } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

const FIELD_LABELS: Record<string, string> = {
  cost: "Cost",
  residualValue: "Residual Value",
  rate: "Rate (%)",
  usefulLife: "Useful Life",
  accumulatedDepreciation: "Accum. Depreciation",
};

export default async function AdjustmentsPage() {
  const rows = await db.select().from(adjustments).orderBy(desc(adjustments.createdAt));

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <PageHeader title="Adjustments" subtitle="Cost, revaluation, impairment and other adjustments" />
      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <Empty message="No adjustments recorded yet. Open an asset and choose Adjust." />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Asset</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Change</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
                <th className="px-4 py-3 font-medium">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600">{fmtDate(a.adjustmentDate)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/assets/${a.assetId}`} className="text-brand-blue hover:underline">
                      {a.assetTag}
                    </Link>
                    <div className="text-xs text-slate-400">{a.assetName}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{ADJUSTMENT_TYPE_LABELS[a.type] || a.type}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">
                    {a.field ? (
                      <>
                        {FIELD_LABELS[a.field] || a.field}: {a.oldValue} → {a.newValue}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtMVR(a.amount, false)}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs max-w-xs truncate">{a.reason || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
