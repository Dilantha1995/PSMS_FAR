import { PageHeader, Card, Btn, Field } from "@/components/ui";
import { getAllCategories } from "@/lib/queries";
import { createCategory } from "@/lib/actions/categories";
import { db } from "@/db";
import { assets } from "@/db/schema";
import { METHOD_LABELS } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const cats = await getAllCategories();
  const allAssets = await db.select({ categoryId: assets.categoryId }).from(assets);
  const counts = new Map<number, number>();
  for (const a of allAssets) counts.set(a.categoryId, (counts.get(a.categoryId) || 0) + 1);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <PageHeader title="Categories" subtitle="Asset classes and their default depreciation settings" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            {cats.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">No categories yet. Add one on the right.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Code</th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Method</th>
                    <th className="px-4 py-3 font-medium text-right">Rate</th>
                    <th className="px-4 py-3 font-medium text-right">Life</th>
                    <th className="px-4 py-3 font-medium text-right">Assets</th>
                    <th className="px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cats.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs">{c.code}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{c.name}</div>
                        {!c.active && <span className="text-xs text-red-500">inactive</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{METHOD_LABELS[c.defaultMethod]}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{c.defaultRate}%</td>
                      <td className="px-4 py-3 text-right tabular-nums">{c.defaultUsefulLife || "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{counts.get(c.id) || 0}</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/categories/${c.id}/edit`} className="text-brand-blue hover:underline text-xs">
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        <Card className="p-5 h-fit">
          <h3 className="font-semibold text-slate-800 mb-4">Add Category</h3>
          <form action={createCategory} className="space-y-4">
            <Field label="Code" name="code" required placeholder="IT, FURN, MED…" />
            <Field label="Name" name="name" required placeholder="IT Equipment" />
            <Field label="Description" name="description" type="textarea" />
            <Field
              label="Default Method"
              name="defaultMethod"
              options={[
                { value: "STRAIGHT_LINE", label: "Straight Line" },
                { value: "REDUCING_BALANCE", label: "Reducing Balance" },
              ]}
            />
            <Field label="Default Rate (%)" name="defaultRate" type="number" step="0.01" defaultValue="0" />
            <Field label="Default Useful Life (yrs)" name="defaultUsefulLife" type="number" defaultValue="0" />
            <Btn type="submit">Add Category</Btn>
          </form>
        </Card>
      </div>
    </div>
  );
}
