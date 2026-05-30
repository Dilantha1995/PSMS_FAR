import { PageHeader, Card, Btn, StatusBadge } from "@/components/ui";
import { postRun, deleteRun } from "@/lib/actions/depreciation";
import { db } from "@/db";
import { depreciationRuns, depreciationLines } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { fmtMVR, fmtDate, fmtDateTime, METHOD_LABELS } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function RunDetail({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const [run] = await db.select().from(depreciationRuns).where(eq(depreciationRuns.id, id));
  if (!run) notFound();
  const lines = await db
    .select()
    .from(depreciationLines)
    .where(eq(depreciationLines.runId, id))
    .orderBy(depreciationLines.assetTag);

  const isDraft = run.status === "DRAFT";

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <PageHeader
        title={run.label}
        subtitle={`${fmtDate(run.periodStart)} – ${fmtDate(run.periodEnd)}`}
        action={
          <>
            <Btn href="/depreciation" variant="secondary">
              Back
            </Btn>
            {isDraft && (
              <>
                <form action={postRun}>
                  <input type="hidden" name="runId" value={run.id} />
                  <Btn type="submit">Post / Record</Btn>
                </form>
                <form action={deleteRun}>
                  <input type="hidden" name="runId" value={run.id} />
                  <Btn type="submit" variant="danger">
                    Delete Draft
                  </Btn>
                </form>
              </>
            )}
          </>
        }
      />

      <div className="flex items-center gap-3 mb-4">
        <StatusBadge status={run.status} />
        {run.status === "POSTED" && (
          <span className="text-xs text-slate-400">
            Posted by {run.postedBy} · {fmtDateTime(run.postedAt)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-xs uppercase text-slate-500">Assets</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{run.assetCount}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase text-slate-500">Total Depreciation</div>
          <div className="text-2xl font-bold text-brand-orange mt-1">{fmtMVR(run.totalDepreciation, false)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase text-slate-500">Status</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{run.status === "POSTED" ? "Posted" : "Draft"}</div>
        </Card>
      </div>

      {run.notes && <p className="text-sm text-slate-500 mb-4">{run.notes}</p>}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Tag</th>
              <th className="px-4 py-3 font-medium">Asset</th>
              <th className="px-4 py-3 font-medium">Method</th>
              <th className="px-4 py-3 font-medium text-right">Opening NBV</th>
              <th className="px-4 py-3 font-medium text-right">Depreciation</th>
              <th className="px-4 py-3 font-medium text-right">Closing NBV</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lines.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs">
                  <Link href={`/assets/${l.assetId}`} className="text-brand-blue hover:underline">
                    {l.assetTag}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-800">{l.assetName}</td>
                <td className="px-4 py-3 text-slate-600 text-xs">{METHOD_LABELS[l.method]}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtMVR(l.openingNbv, false)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-orange-600">{fmtMVR(l.depreciation, false)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtMVR(l.closingNbv, false)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 font-semibold text-slate-700">
            <tr>
              <td className="px-4 py-3" colSpan={4}>
                Total
              </td>
              <td className="px-4 py-3 text-right tabular-nums">{fmtMVR(run.totalDepreciation, false)}</td>
              <td className="px-4 py-3"></td>
            </tr>
          </tfoot>
        </table>
      </Card>

      {isDraft && (
        <p className="text-xs text-slate-400 mt-3">
          Posting recomputes from current asset values, adds the depreciation to each asset&apos;s accumulated
          depreciation, and locks the run.
        </p>
      )}
    </div>
  );
}
