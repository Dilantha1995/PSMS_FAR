import { PageHeader, Card, Btn, Empty } from "@/components/ui";
import { db } from "@/db";
import { transfers } from "@/db/schema";
import { desc } from "drizzle-orm";
import { fmtDate } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TransfersPage() {
  const rows = await db.select().from(transfers).orderBy(desc(transfers.createdAt));

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <PageHeader
        title="Transfers"
        subtitle="Asset transfers and generated notes"
        action={<Btn href="/transfers/new">+ Transfer</Btn>}
      />

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
