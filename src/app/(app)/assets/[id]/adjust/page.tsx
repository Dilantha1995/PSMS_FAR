import { PageHeader, Card, Btn, Field } from "@/components/ui";
import { db } from "@/db";
import { assets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { createAdjustment } from "@/lib/actions/adjustments";
import { fmtMVR, todayISO, num, ADJUSTMENT_TYPE_LABELS } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdjustPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const [asset] = await db.select().from(assets).where(eq(assets.id, id));
  if (!asset) notFound();

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <PageHeader
        title="Adjust Asset"
        subtitle={`${asset.assetTag} — ${asset.name}`}
        action={
          <Btn href={`/assets/${id}`} variant="secondary">
            Cancel
          </Btn>
        }
      />

      <Card className="p-5 mb-6">
        <h3 className="font-semibold text-slate-800 mb-4">Current Values</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div>
            <div className="text-xs text-slate-400 uppercase">Cost</div>
            <div className="text-slate-800 mt-0.5 tabular-nums">{fmtMVR(asset.cost, false)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase">Residual</div>
            <div className="text-slate-800 mt-0.5 tabular-nums">{fmtMVR(asset.residualValue, false)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase">Accum. Dep</div>
            <div className="text-slate-800 mt-0.5 tabular-nums">{fmtMVR(asset.accumulatedDepreciation, false)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase">Rate</div>
            <div className="text-slate-800 mt-0.5 tabular-nums">{num(asset.rate)}%</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase">Useful Life</div>
            <div className="text-slate-800 mt-0.5 tabular-nums">{asset.usefulLife || "—"} yrs</div>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <form action={createAdjustment} className="space-y-5">
          <input type="hidden" name="assetId" value={asset.id} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="Adjustment Type"
              name="type"
              required
              options={Object.entries(ADJUSTMENT_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
            />
            <Field label="Adjustment Date" name="adjustmentDate" type="date" defaultValue={todayISO()} required />
            <Field
              label="Field to Change"
              name="field"
              options={[
                { value: "", label: "— None (record only) —" },
                { value: "cost", label: "Cost" },
                { value: "residualValue", label: "Residual Value" },
                { value: "rate", label: "Annual Rate (%)" },
                { value: "usefulLife", label: "Useful Life (years)" },
                { value: "accumulatedDepreciation", label: "Accumulated Depreciation" },
              ]}
            />
            <Field label="New Value" name="newValue" type="number" step="0.01" placeholder="New value for the field" />
            <Field label="Approved By" name="approvedBy" />
          </div>
          <Field label="Reason / Remarks" name="reason" type="textarea" />
          <p className="text-xs text-slate-400">
            Selecting a field will update the asset to the new value and record the change (old → new) in history. Leave
            the field as &ldquo;None&rdquo; to log a note-only adjustment using the New Value as the amount.
          </p>
          <div className="flex gap-2">
            <Btn type="submit">Record Adjustment</Btn>
            <Btn href={`/assets/${id}`} variant="secondary">
              Cancel
            </Btn>
          </div>
        </form>
      </Card>
    </div>
  );
}
