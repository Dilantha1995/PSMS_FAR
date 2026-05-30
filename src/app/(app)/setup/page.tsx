import { PageHeader, Card, Btn, Field, StatusBadge } from "@/components/ui";
import { getAllCategories, getAllSubCategories, getAllLocations } from "@/lib/queries";
import { createSubCategory, createLocation } from "@/lib/actions/coding";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const [cats, subs, locs] = await Promise.all([
    getAllCategories(),
    getAllSubCategories(),
    getAllLocations(),
  ]);
  const catName = new Map(cats.map((c) => [c.id, c]));

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <PageHeader
        title="Coding Setup"
        subtitle="Codes used to auto-generate asset tags: PSMS / Category / Sub-category / Location / Number"
      />

      <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-800">
          Asset codes are built as <span className="font-mono">PSMS / {"{"}CATEGORY{"}"} / {"{"}SUB{"}"} / {"{"}LOCATION
          {"}"} / {"{"}NUMBER{"}"}</span>. The number continues automatically from your existing assets. Main category
          codes are edited under <a href="/categories" className="underline font-medium">Categories</a>.
        </p>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sub categories */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 font-semibold text-slate-800">
              Sub-categories ({subs.length})
            </div>
            <div className="max-h-[460px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600 text-left sticky top-0">
                  <tr>
                    <th className="px-4 py-2 font-medium">Code</th>
                    <th className="px-4 py-2 font-medium">Name</th>
                    <th className="px-4 py-2 font-medium">Main Category</th>
                    <th className="px-4 py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subs.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2 font-mono text-xs">{s.code}</td>
                      <td className="px-4 py-2 text-slate-800">{s.name}</td>
                      <td className="px-4 py-2 text-slate-500 text-xs">{catName.get(s.categoryId)?.code || "—"}</td>
                      <td className="px-4 py-2 text-right">{!s.active && <StatusBadge status="inactive" />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <Card className="p-5 h-fit">
          <h3 className="font-semibold text-slate-800 mb-4">Add Sub-category</h3>
          <form action={createSubCategory} className="space-y-4">
            <Field
              label="Main Category"
              name="categoryId"
              required
              options={cats.map((c) => ({ value: String(c.id), label: `${c.code} — ${c.name}` }))}
            />
            <Field label="Code" name="code" required placeholder="CH, DT, LAP…" />
            <Field label="Name" name="name" required placeholder="Chairs & Seating" />
            <Btn type="submit">Add Sub-category</Btn>
          </form>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 font-semibold text-slate-800">
              Locations ({locs.length})
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">Code</th>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {locs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-mono text-xs">{l.code}</td>
                    <td className="px-4 py-2 text-slate-800">{l.name}</td>
                    <td className="px-4 py-2 text-right">{!l.active && <StatusBadge status="inactive" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        <Card className="p-5 h-fit">
          <h3 className="font-semibold text-slate-800 mb-4">Add Location</h3>
          <form action={createLocation} className="space-y-4">
            <Field label="Code" name="code" required placeholder="HO, WH1, SC…" />
            <Field label="Name" name="name" required placeholder="Head Office" />
            <Btn type="submit">Add Location</Btn>
          </form>
        </Card>
      </div>
    </div>
  );
}
