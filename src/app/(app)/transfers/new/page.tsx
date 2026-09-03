import { PageHeader, Card, Btn } from "@/components/ui";
import { getActiveAssets } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function NewTransferPage({ searchParams }: { searchParams: { asset?: string } }) {
  const active = await getActiveAssets();

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <PageHeader
        title="New Transfer"
        subtitle="Choose how to generate the Transfer Note"
        action={
          <Btn href="/transfers" variant="secondary">
            Cancel
          </Btn>
        }
      />

      {searchParams.asset && (
        <Card className="p-4 mb-6 bg-amber-50 border-amber-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-amber-800">Continue to the transfer form for the selected asset.</span>
            <Btn href={`/assets/${searchParams.asset}/transfer`}>Open Transfer Form</Btn>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-semibold text-slate-800 mb-1">Select Asset from FAR</h3>
          <p className="text-sm text-slate-500 mb-4">
            Pick a registered asset — its current location, department and custodian pre-fill the form.
          </p>
          {active.length > 0 ? (
            <form method="get" className="flex gap-2">
              <select
                name="asset"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
                defaultValue=""
              >
                <option value="" disabled>
                  Select asset…
                </option>
                {active.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.assetTag} — {a.name}
                  </option>
                ))}
              </select>
              <Btn type="submit">Go</Btn>
            </form>
          ) : (
            <p className="text-sm text-slate-400">No active assets in the FAR.</p>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-slate-800 mb-1">Manual Transfer</h3>
          <p className="text-sm text-slate-500 mb-4">
            For an asset that is not recorded in the FAR — type in every detail by hand.
          </p>
          <Btn href="/transfers/manual">Manual Transfer Note</Btn>
        </Card>
      </div>
    </div>
  );
}
