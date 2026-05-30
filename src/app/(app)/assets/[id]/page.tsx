import { PageHeader, Card, Btn, StatusBadge } from "@/components/ui";
import { db } from "@/db";
import { assets, categories, documents, adjustments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { activityForEntity } from "@/lib/activity";
import { buildSchedule, DepAssetInput } from "@/lib/depreciation";
import { fmtMVR, fmtDate, fmtDateTime, METHOD_LABELS, num, ADJUSTMENT_TYPE_LABELS } from "@/lib/format";
import { nbv } from "@/lib/queries";
import Link from "next/link";

export const dynamic = "force-dynamic";

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-slate-400 uppercase tracking-wide">{label}</div>
      <div className="text-sm text-slate-800 mt-0.5">{value ?? "—"}</div>
    </div>
  );
}

export default async function AssetDetail({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const [asset] = await db.select().from(assets).where(eq(assets.id, id));
  if (!asset) notFound();
  const [cat] = await db.select().from(categories).where(eq(categories.id, asset.categoryId));
  const history = await activityForEntity("ASSET", id);
  const docs = await db.select().from(documents).where(eq(documents.relatedAssetId, id)).orderBy(desc(documents.createdAt));
  const adjs = await db.select().from(adjustments).where(eq(adjustments.assetId, id)).orderBy(desc(adjustments.createdAt));

  const depInput: DepAssetInput = {
    id: asset.id,
    assetTag: asset.assetTag,
    name: asset.name,
    cost: num(asset.cost),
    residualValue: num(asset.residualValue),
    accumulatedDepreciation: num(asset.accumulatedDepreciation),
    method: asset.method,
    rate: num(asset.rate),
    usefulLife: asset.usefulLife,
    acquisitionDate: asset.acquisitionDate,
    depreciationStart: asset.depreciationStart,
    status: asset.status,
  };
  const schedule = buildSchedule(depInput);
  const isActive = asset.status === "ACTIVE" || asset.status === "FULLY_DEPRECIATED";

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <PageHeader
        title={asset.name}
        subtitle={`${asset.assetTag} · ${cat ? cat.code + " — " + cat.name : ""}`}
        action={
          <>
            <Btn href="/assets" variant="secondary">
              Back
            </Btn>
            <Btn href={`/assets/${id}/edit`} variant="secondary">
              Edit
            </Btn>
            {isActive && (
              <>
                <Btn href={`/assets/${id}/transfer`} variant="secondary">
                  ⇄ Transfer
                </Btn>
                <Btn href={`/assets/${id}/adjust`} variant="secondary">
                  ± Adjust
                </Btn>
                <Btn href={`/assets/${id}/dispose`} variant="danger">
                  ⊗ Dispose
                </Btn>
              </>
            )}
          </>
        }
      />

      <div className="flex items-center gap-3 mb-4">
        <StatusBadge status={asset.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-semibold text-slate-800 mb-4">Asset Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Detail label="Category" value={cat ? `${cat.code} — ${cat.name}` : "—"} />
            <Detail label="Location" value={asset.location} />
            <Detail label="Department" value={asset.department} />
            <Detail label="Custodian" value={asset.custodian} />
            <Detail label="Serial No." value={asset.serialNo} />
            <Detail label="Supplier" value={asset.supplier} />
            <Detail label="Invoice No." value={asset.invoiceNo} />
            <Detail label="Acquired" value={fmtDate(asset.acquisitionDate)} />
            <Detail label="Dep. Start" value={fmtDate(asset.depreciationStart)} />
            <Detail label="Method" value={METHOD_LABELS[asset.method]} />
            <Detail label="Rate" value={`${num(asset.rate)}%`} />
            <Detail label="Useful Life" value={asset.usefulLife ? `${asset.usefulLife} yrs` : "—"} />
          </div>
          {asset.description && (
            <div className="mt-4">
              <Detail label="Description" value={asset.description} />
            </div>
          )}
          {asset.notes && (
            <div className="mt-4">
              <Detail label="Notes" value={asset.notes} />
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Valuation</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Cost</span>
              <span className="text-sm font-medium tabular-nums">{fmtMVR(asset.cost, false)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Residual</span>
              <span className="text-sm tabular-nums">{fmtMVR(asset.residualValue, false)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Accum. Depreciation</span>
              <span className="text-sm tabular-nums text-orange-600">
                {fmtMVR(asset.accumulatedDepreciation, false)}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-3">
              <span className="text-sm font-semibold text-slate-700">Net Book Value</span>
              <span className="text-base font-bold tabular-nums text-brand-green">{fmtMVR(nbv(asset), false)}</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-5 mt-6">
        <h3 className="font-semibold text-slate-800 mb-4">Projected Depreciation Schedule</h3>
        {schedule.length === 0 ? (
          <p className="text-sm text-slate-400">No depreciation projected (already at residual value).</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Year</th>
                  <th className="px-3 py-2 font-medium text-right">Opening NBV</th>
                  <th className="px-3 py-2 font-medium text-right">Depreciation</th>
                  <th className="px-3 py-2 font-medium text-right">Closing NBV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schedule.map((r) => (
                  <tr key={r.year}>
                    <td className="px-3 py-2">{r.year}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmtMVR(r.opening, false)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-orange-600">{fmtMVR(r.depreciation, false)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmtMVR(r.closing, false)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-slate-400 mt-2">
          Indicative projection based on current values; actual postings are recorded via depreciation runs.
        </p>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card className="p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Documents</h3>
          {docs.length === 0 ? (
            <p className="text-sm text-slate-400">No documents generated.</p>
          ) : (
            <ul className="space-y-2">
              {docs.map((d) => (
                <li key={d.id} className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                  <div>
                    <Link href={`/documents/${d.id}`} className="text-brand-blue hover:underline">
                      {d.referenceNo}
                    </Link>
                    <div className="text-xs text-slate-400">{d.title}</div>
                  </div>
                  <span className="text-xs text-slate-400">{fmtDate(d.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Adjustments</h3>
          {adjs.length === 0 ? (
            <p className="text-sm text-slate-400">No adjustments recorded.</p>
          ) : (
            <ul className="space-y-2">
              {adjs.map((a) => (
                <li key={a.id} className="text-sm border-b border-slate-100 pb-2">
                  <div className="text-slate-700">{ADJUSTMENT_TYPE_LABELS[a.type] || a.type}</div>
                  <div className="text-xs text-slate-400">
                    {a.field ? `${a.field}: ${a.oldValue} → ${a.newValue}` : `Amount ${fmtMVR(a.amount, false)}`} ·{" "}
                    {fmtDate(a.adjustmentDate)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="p-5 mt-6">
        <h3 className="font-semibold text-slate-800 mb-4">History</h3>
        {history.length === 0 ? (
          <p className="text-sm text-slate-400">No history.</p>
        ) : (
          <ul className="space-y-3">
            {history.map((h) => (
              <li key={h.id} className="text-sm border-b border-slate-100 pb-2 last:border-0">
                <div className="text-slate-700">{h.summary}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {h.user} · {fmtDateTime(h.createdAt)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
