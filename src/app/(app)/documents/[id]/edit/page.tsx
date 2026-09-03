import { PageHeader, Card, Btn, Field, Empty } from "@/components/ui";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { updateTransfer } from "@/lib/actions/transfers";

export const dynamic = "force-dynamic";

export default async function EditTransferPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const [doc] = await db.select().from(documents).where(eq(documents.id, id));
  if (!doc) notFound();

  if (!isAdmin()) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <PageHeader title="Edit Transfer Note" action={<Btn href={`/documents/${id}`} variant="secondary">Back</Btn>} />
        <Card className="p-6">
          <Empty message="Editing an already-submitted transfer note is available to administrators only." />
        </Card>
      </div>
    );
  }

  if (doc.type !== "TRANSFER") {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <PageHeader title="Edit Document" action={<Btn href={`/documents/${id}`} variant="secondary">Back</Btn>} />
        <Card className="p-6">
          <Empty message="Only Transfer Notes can be edited here." />
        </Card>
      </div>
    );
  }

  const p = doc.payload as any;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <PageHeader
        title="Edit Transfer Note"
        subtitle={`${doc.referenceNo} — ${p.assetTag}`}
        action={
          <Btn href={`/documents/${id}`} variant="secondary">
            Cancel
          </Btn>
        }
      />

      <Card className="p-4 mb-6 bg-amber-50 border-amber-200">
        <p className="text-sm text-amber-800">
          This edits the already-generated note directly. It does not change the asset's current location or
          custodian in the FAR — if a later transfer has moved the asset on, that record is untouched.
        </p>
      </Card>

      <Card className="p-5">
        <form action={updateTransfer} className="space-y-5">
          <input type="hidden" name="documentId" value={doc.id} />

          <h3 className="font-semibold text-slate-800">Asset Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Asset Code" name="assetTag" defaultValue={p.assetTag || ""} required />
            <Field label="Asset Name" name="assetName" defaultValue={p.assetName || ""} required />
            <Field label="Serial Number" name="serialNo" defaultValue={p.serialNo || ""} />
            <Field label="Category" name="category" defaultValue={p.category || ""} />
          </div>

          <h3 className="font-semibold text-slate-800 pt-2">Transfer</h3>
          <Field label="Transfer Date" name="transferDate" type="date" defaultValue={p.transferDate || ""} required />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="From Location" name="fromLocation" defaultValue={p.from?.location || ""} />
            <Field label="From Department" name="fromDepartment" defaultValue={p.from?.department || ""} />
            <Field label="From Custodian" name="fromCustodian" defaultValue={p.from?.custodian || ""} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="To Location" name="toLocation" defaultValue={p.to?.location || ""} />
            <Field label="To Department" name="toDepartment" defaultValue={p.to?.department || ""} />
          </div>

          <h3 className="font-semibold text-slate-800 pt-2">Receiving Person</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Name" name="toCustodian" defaultValue={p.to?.custodian || ""} />
            <Field label="Designation" name="toDesignation" defaultValue={p.to?.designation || ""} />
          </div>

          <Field label="Other Accessories" name="accessories" type="textarea" defaultValue={p.accessories || ""} />
          <Field label="Approved By" name="approvedBy" defaultValue={p.approvedBy || ""} />
          <Field label="Reason / Remarks" name="reason" type="textarea" defaultValue={p.reason || ""} />

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="external" defaultChecked={!!p.external} className="rounded border-slate-300" />
            External transfer (asset leaves the company)
          </label>

          <div className="flex gap-2">
            <Btn type="submit">Save Changes</Btn>
            <Btn href={`/documents/${id}`} variant="secondary">
              Cancel
            </Btn>
          </div>
        </form>
      </Card>
    </div>
  );
}
