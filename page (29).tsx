import { PageHeader, Card, Btn, Field } from "@/components/ui";
import { db } from "@/db";
import { assets, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { createDisposal } from "@/lib/actions/disposals";
import { nbv } from "@/lib/queries";
import { fmtMVR, fmtDate, todayISO, DISPOSAL_METHOD_LABELS } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DisposePage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const [asset] = await db.select().from(assets).where(eq(assets.id, id));
  if (!asset) notFound();
  const [cat] = await db.select().from(categories).where(eq(categories.id, asset.categoryId));

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <PageHeader
        title="Dispose Asset"
        subtitle={`${asset.assetTag} — ${asset.name}`}
        action={
          <Btn href={`/assets/${id}`} variant="secondary">
            Cancel
          </Btn>
        }
      />

      <Card className="p-5 mb-6">
        <h3 className="font-semibold text-slate-800 mb-4">Current Valuation</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-xs text-slate-400 uppercase">Category</div>
            <div className="text-slate-800 mt-0.5">{cat ? `${cat.code}` : "—"}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase">Cost</div>
            <div className="text-slate-800 mt-0.5 tabular-nums">{fmtMVR(asset.cost, false)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase">Accum. Dep</div>
            <div className="text-slate-800 mt-0.5 tabular-nums">{fmtMVR(asset.accumulatedDepreciation, false)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase">Net Book Value</div>
            <div className="text-brand-green font-semibold mt-0.5 tabular-nums">{fmtMVR(nbv(asset), false)}</div>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3">
          Gain / loss on disposal = Proceeds − Net Book Value ({fmtMVR(nbv(asset), false)}). A disposal note with a
          reference number will be generated on submit.
        </p>
      </Card>

      <Card className="p-5">
        <form action={createDisposal} className="space-y-5">
          <input type="hidden" name="assetId" value={asset.id} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Disposal Date" name="disposalDate" type="date" defaultValue={todayISO()} required />
            <Field
              label="Disposal Method"
              name="method"
              required
              options={Object.entries(DISPOSAL_METHOD_LABELS).map(([value, label]) => ({ value, label }))}
            />
            <Field label="Proceeds (MVR)" name="proceeds" type="number" step="0.01" defaultValue="0" />
            <Field label="Buyer / Recipient" name="buyer" placeholder="If sold or donated" />
            <Field label="Approved By" name="approvedBy" />
          </div>
          <Field label="Reason / Remarks" name="reason" type="textarea" />
          <div className="flex gap-2">
            <Btn type="submit" variant="danger">
              Dispose & Generate Note
            </Btn>
            <Btn href={`/assets/${id}`} variant="secondary">
              Cancel
            </Btn>
          </div>
        </form>
      </Card>
    </div>
  );
}
