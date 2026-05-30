import { PageHeader, Card, Btn, Empty } from "@/components/ui";
import { db } from "@/db";
import { transfers } from "@/db/schema";
import { desc } from "drizzle-orm";
import { getActiveAssets } from "@/lib/queries";
import { fmtDate } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TransfersPage({ searchParams }: { searchParams: { asset?: string } }) {
  const rows = await db.select().from(transfers).orderBy(desc(transfers.createdAt));
  const active = await getActiveAssets();

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <PageHeader
        title="Transfers"
        subtitle="Asset transfers and generated notes"
        action={
          active.length > 0 ? (
            <form method="get" className="flex gap-2 items-end">
              <select
                name="asset"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
                defaultValue=""
              >
                <option value="" disabled>
                  Select asset to transfer…
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
            <span className="text-sm text-amber-800">Continue to the transfer form for the selected asset.</span>
            <Btn href={`/assets/${searchParams.asset}/transfer`}>Open Transfer Form</Btn>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <Empty message="No transfers recorded yet." />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Asset</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">From</th>
                <th className="px-4 py-3 font-medium">To</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">{t.referenceNo}</td>
                  <td className="px-4 py-3">
                    <Link href={`/assets/${t.assetId}`} className="text-brand-blue hover:underline">
                      {t.assetTag}
                    </Link>
                    <div className="text-xs text-slate-400">{t.assetName}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{fmtDate(t.transferDate)}</td>
                  <td className="px-4 py-3 text-slate-600">{t.fromLocation || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{t.toLocation || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    {t.documentId && (
                      <Link href={`/documents/${t.documentId}`} className="text-brand-blue hover:underline text-xs">
                        Note
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
