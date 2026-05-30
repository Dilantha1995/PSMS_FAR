import { PageHeader, Card, Btn, StatusBadge, Empty } from "@/components/ui";
import { getAssetsWithCategory, getAllCategories, nbv } from "@/lib/queries";
import { fmtMVR, fmtDate, STATUS_LABELS } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; cat?: string };
}) {
  const [rows, cats] = await Promise.all([getAssetsWithCategory(), getAllCategories()]);
  const q = (searchParams.q || "").toLowerCase();
  const status = searchParams.status || "";
  const cat = searchParams.cat || "";

  const filtered = rows.filter((r) => {
    if (status && r.asset.status !== status) return false;
    if (cat && String(r.asset.categoryId) !== cat) return false;
    if (q) {
      const hay = `${r.asset.assetTag} ${r.asset.name} ${r.asset.serialNo || ""} ${
        r.asset.location || ""
      } ${r.asset.custodian || ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const totalCost = filtered.reduce((s, r) => s + parseFloat(r.asset.cost), 0);
  const totalNbv = filtered.reduce((s, r) => s + nbv(r.asset), 0);

  const exportQs = new URLSearchParams({ q, status, cat }).toString();

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <PageHeader
        title="Master FAR"
        subtitle={`${filtered.length} of ${rows.length} assets`}
        action={
          <>
            <Btn href={`/api/export?fmt=xlsx&${exportQs}`} variant="secondary">
              ⬇ Excel
            </Btn>
            <Btn href={`/api/export?fmt=csv&${exportQs}`} variant="secondary">
              ⬇ CSV
            </Btn>
            <Btn href="/assets/new">+ Add Asset</Btn>
          </>
        }
      />

      <Card className="p-4 mb-4">
        <form className="flex flex-wrap gap-3 items-end" method="get">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Search</label>
            <input
              name="q"
              defaultValue={searchParams.q}
              placeholder="Tag, name, serial, location…"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm w-64"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Status</label>
            <select name="status" defaultValue={status} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="">All</option>
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Category</label>
            <select name="cat" defaultValue={cat} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="">All</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>
          <Btn variant="secondary" type="submit">
            Filter
          </Btn>
          <Btn variant="ghost" href="/assets">
            Reset
          </Btn>
        </form>
      </Card>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <Empty message="No assets match your filters." action={<Btn href="/assets/new">+ Add Asset</Btn>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Tag</th>
                  <th className="px-4 py-3 font-medium">Asset</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Acquired</th>
                  <th className="px-4 py-3 font-medium text-right">Cost</th>
                  <th className="px-4 py-3 font-medium text-right">Accum. Dep</th>
                  <th className="px-4 py-3 font-medium text-right">NBV</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r.asset.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs">
                      <Link href={`/assets/${r.asset.id}`} className="text-brand-blue hover:underline">
                        {r.asset.assetTag}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{r.asset.name}</div>
                      {r.asset.serialNo && <div className="text-xs text-slate-400">SN: {r.asset.serialNo}</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.category?.code || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{r.asset.location || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{fmtDate(r.asset.acquisitionDate)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{fmtMVR(r.asset.cost, false)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-500">
                      {fmtMVR(r.asset.accumulatedDepreciation, false)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">{fmtMVR(nbv(r.asset), false)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.asset.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 font-semibold text-slate-700">
                <tr>
                  <td className="px-4 py-3" colSpan={5}>
                    Totals ({filtered.length})
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtMVR(totalCost, false)}</td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtMVR(totalNbv, false)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
