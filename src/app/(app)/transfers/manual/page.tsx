import { PageHeader, Card, Btn, Field } from "@/components/ui";
import { createManualTransfer } from "@/lib/actions/transfers";
import { todayISO } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function ManualTransferPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <PageHeader
        title="Generate Transfer Note (Manual)"
        subtitle="For an asset that is not recorded in the FAR — fill in the details by hand"
        action={
          <Btn href="/transfers" variant="secondary">
            Cancel
          </Btn>
        }
      />

      <Card className="p-4 mb-6 bg-amber-50 border-amber-200">
        <p className="text-sm text-amber-800">
          Use this only when the asset being transferred is not in the Fixed Asset Register (e.g. it was never
          added, or is out of scope). It generates a printable, numbered Transfer Note from the details you
          type below — it does not create or update any asset record.
        </p>
      </Card>

      <Card className="p-5">
        <form action={createManualTransfer} className="space-y-5">
          <h3 className="font-semibold text-slate-800">Asset Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Asset Code" name="assetTag" required placeholder="e.g. PS/OE/LAP/HO/017" />
            <Field label="Asset Name" name="assetName" required placeholder="e.g. Lenovo E16 - (i7/16GB/512SSD)" />
            <Field label="Serial Number" name="serialNo" />
            <Field label="Category" name="category" placeholder="e.g. OE — Office Equipment" />
          </div>

          <h3 className="font-semibold text-slate-800 pt-2">Transfer</h3>
          <Field label="Transfer Date" name="transferDate" type="date" defaultValue={todayISO()} required />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="From Location" name="fromLocation" />
            <Field label="From Department" name="fromDepartment" />
            <Field label="From Custodian" name="fromCustodian" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="To Location" name="toLocation" />
            <Field label="To Department" name="toDepartment" />
          </div>
          <h3 className="font-semibold text-slate-800 pt-2">Receiving Person</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Name" name="toCustodian" />
            <Field label="Designation" name="toDesignation" />
          </div>

          <Field
            label="Other Accessories"
            name="accessories"
            type="textarea"
            placeholder="e.g. Charger, laptop bag, mouse, docking station"
          />
          <Field label="Approved By" name="approvedBy" />
          <Field label="Reason / Remarks" name="reason" type="textarea" />

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="external" className="rounded border-slate-300" />
            External transfer (asset leaves the company)
          </label>

          <div className="flex gap-2">
            <Btn type="submit">Generate Transfer Note</Btn>
            <Btn href="/transfers" variant="secondary">
              Cancel
            </Btn>
          </div>
        </form>
      </Card>
    </div>
  );
}
