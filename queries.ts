import { PageHeader, Card, Btn } from "@/components/ui";
import { importAssets } from "@/lib/actions/import";

export const dynamic = "force-dynamic";

export default function ImportPage({
  searchParams,
}: {
  searchParams: { ok?: string; upd?: string; skip?: string; err?: string };
}) {
  const { ok, upd, skip, err } = searchParams;
  const showResult = ok !== undefined || err !== undefined;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <PageHeader title="Import Assets" subtitle="Load your existing FAR from an Excel or CSV file" />

      {showResult &&
        (err ? (
          <Card className="p-4 mb-6 bg-red-50 border-red-200">
            <p className="text-sm text-red-700">Import failed: {err}</p>
          </Card>
        ) : (
          <Card className="p-4 mb-6 bg-green-50 border-green-200">
            <p className="text-sm text-green-800">
              Import complete — {ok} added, {upd} updated, {skip} skipped.{" "}
              <a href="/assets" className="underline font-medium">
                View Master FAR
              </a>
            </p>
          </Card>
        ))}

      <Card className="p-5 mb-6">
        <form action={importAssets} className="space-y-4">
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">Excel / CSV file</span>
            <input
              type="file"
              name="file"
              accept=".xlsx,.xls,.csv"
              required
              className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-brand-blue file:px-4 file:py-2 file:text-white file:text-sm hover:file:bg-brand-blueDark"
            />
          </label>
          <Btn type="submit">Import</Btn>
        </form>
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold text-slate-800 mb-3">Expected columns</h3>
        <p className="text-sm text-slate-600 mb-3">
          The first row should contain headers. Column names are matched flexibly (case and spacing are ignored), and
          common variations are accepted. Recognised fields:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1 text-sm text-slate-600">
          {[
            "Asset Tag *",
            "Name *",
            "Category",
            "Description",
            "Location",
            "Department",
            "Custodian",
            "Supplier",
            "Invoice No",
            "Serial No",
            "Acquisition Date",
            "Cost",
            "Residual Value",
            "Method",
            "Rate",
            "Useful Life",
            "Accum. Depreciation",
            "Depreciation Start",
          ].map((c) => (
            <div key={c}>• {c}</div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-4">
          Rows are matched by Asset Tag — existing assets are updated, new tags are added. Unknown categories are
          created automatically. Rows without a tag or name are skipped. Dates accept yyyy-mm-dd or dd/mm/yyyy.
        </p>
      </Card>
    </div>
  );
}
