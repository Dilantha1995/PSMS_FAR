import { PageHeader, Card, Btn, Empty } from "@/components/ui";
import { db } from "@/db";
import { disposals } from "@/db/schema";
import { desc } from "drizzle-orm";
import { getActiveAssets } from "@/lib/queries";
import { fmtMVR, fmtDate, DISPOSAL_METHOD_LABELS } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DisposalsPage({ searchParams }: { searchParams: { asset?: string } }) {
  const rows = await db.select().from(disposals).orderBy(desc(disposals.createdAt));
  const active = await getActiveAssets();

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <PageHeader
        title="Disposals"
        subtitle="Recorded asset disposals and generated notes"
        action={
          active.length > 0 ? (
            <form method="get" className="flex gap-2 items-end">
              <select
                name="asset"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
                defaultValue=""
              >
                <option value="" disabled>
                  Select asset to dispose…
                </option>
                {active.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.assetTag} — {a.name}
                  </option>
                ))}
              </select>
              <Btn variant="secondary" type="submit">
                Go
              </Btn>
            </form>
          ) : undefined
        }
      />

      {searchParams.asset && (
        <Card className="p-4 mb-4 bg-amber-50 border-amber-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-amber-800">Continue to the disposal form for the selected asset.</span>
            <Btn href={`/assets/${searchParams.asset}/dispose`} variant="danger">
              Open Disposal Form
            </Btn>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <Empty message="No disposals recorded yet." />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Asset</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium text-right">NBV</th>
                <th className="px-4 py-3 font-medium text-right">Proceeds</th>
                <th className="px-4 py-3 font-medium text-right">Gain / Loss</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((d) => {
                const gl = parseFloat(d.gainLoss);
                return (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs">{d.referenceNo}</td>
                    <td className="px-4 py-3">
                      <Link href={`/assets/${d.assetId}`} className="text-brand-blue hover:underline">
                        {d.assetTag}
                      </Link>
                      <div className="text-xs text-slate-400">{d.assetName}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{fmtDate(d.disposalDate)}</td>
                    <td className="px-4 py-3 text-slate-600">{DISPOSAL_METHOD_LABELS[d.method] || d.method}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{fmtMVR(d.nbvAtDisposal, false)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{fmtMVR(d.proceeds, false)}</td>
                    <td className={`px-4 py-3 text-right tabular-nums ${gl < 0 ? "text-red-600" : "text-brand-green"}`}>
                      {fmtMVR(d.gainLoss, false)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {d.documentId && (
                        <Link href={`/documents/${d.documentId}`} className="text-brand-blue hover:underline text-xs">
                          Note
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
