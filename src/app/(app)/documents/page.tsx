import { PageHeader, Card, Empty } from "@/components/ui";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { desc } from "drizzle-orm";
import { fmtDateTime } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = { DISPOSAL: "Disposal Note", TRANSFER: "Transfer Note" };

export default async function DocumentsPage() {
  const rows = await db.select().from(documents).orderBy(desc(documents.createdAt));

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <PageHeader title="Documents" subtitle="Generated notes saved with the company letterhead" />
      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <Empty message="No documents generated yet. They are created when you dispose or transfer an asset." />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium text-right">Pages</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">
                    <Link href={`/documents/${d.id}`} className="text-brand-blue hover:underline">
                      {d.referenceNo}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{TYPE_LABELS[d.type] || d.type}</td>
                  <td className="px-4 py-3 text-slate-800">{d.title}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{fmtDateTime(d.createdAt)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{d.pageCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
