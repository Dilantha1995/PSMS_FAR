import { PageHeader, Card, Btn, Field } from "@/components/ui";
import { db } from "@/db";
import { assets, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { createTransfer } from "@/lib/actions/transfers";
import { todayISO } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TransferPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const [asset] = await db.select().from(assets).where(eq(assets.id, id));
  if (!asset) notFound();
  const [cat] = await db.select().from(categories).where(eq(categories.id, asset.categoryId));

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <PageHeader
        title="Transfer Asset"
        subtitle={`${asset.assetTag} — ${asset.name}`}
        action={
          <Btn href={`/assets/${id}`} variant="secondary">
            Cancel
          </Btn>
        }
      />

      <Card className="p-5 mb-6">
        <h3 className="font-semibold text-slate-800 mb-4">Current Assignment</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-xs text-slate-400 uppercase">Location</div>
            <div className="text-slate-800 mt-0.5">{asset.location || "—"}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase">Department</div>
            <div className="text-slate-800 mt-0.5">{asset.department || "—"}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase">Custodian</div>
            <div className="text-slate-800 mt-0.5">{asset.custodian || "—"}</div>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <form action={createTransfer} className="space-y-5">
          <input type="hidden" name="assetId" value={asset.id} />
          <Field label="Transfer Date" name="transferDate" type="date" defaultValue={todayISO()} required />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="New Location" name="toLocation" defaultValue={asset.location || ""} />
            <Field label="New Department" name="toDepartment" defaultValue={asset.department || ""} />
            <Field label="New Custodian" name="toCustodian" defaultValue={asset.custodian || ""} />
          </div>
          <Field label="Approved By" name="approvedBy" />
          <Field label="Reason / Remarks" name="reason" type="textarea" />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="external" className="rounded border-slate-300" />
            External transfer (asset leaves the company — mark as Transferred out)
          </label>
          <div className="flex gap-2">
            <Btn type="submit">Transfer & Generate Note</Btn>
            <Btn href={`/assets/${id}`} variant="secondary">
              Cancel
            </Btn>
          </div>
        </form>
      </Card>
    </div>
  );
}
