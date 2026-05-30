import { PageHeader, Card, Btn, Field } from "@/components/ui";
import { updateCategory } from "@/lib/actions/categories";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const [cat] = await db.select().from(categories).where(eq(categories.id, id));
  if (!cat) notFound();

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <PageHeader
        title="Edit Category"
        subtitle={`${cat.code} — ${cat.name}`}
        action={
          <Btn href="/categories" variant="secondary">
            Back
          </Btn>
        }
      />
      <Card className="p-5">
        <form action={updateCategory} className="space-y-4">
          <input type="hidden" name="id" value={cat.id} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm font-medium text-slate-700 mb-1">Code</span>
              <input
                value={cat.code}
                readOnly
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
              />
            </label>
            <Field label="Name" name="name" defaultValue={cat.name} required />
          </div>
          <Field label="Description" name="description" type="textarea" defaultValue={cat.description || ""} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field
              label="Default Method"
              name="defaultMethod"
              defaultValue={cat.defaultMethod}
              options={[
                { value: "STRAIGHT_LINE", label: "Straight Line" },
                { value: "REDUCING_BALANCE", label: "Reducing Balance" },
              ]}
            />
            <Field label="Default Rate (%)" name="defaultRate" type="number" step="0.01" defaultValue={cat.defaultRate} />
            <Field
              label="Default Useful Life (yrs)"
              name="defaultUsefulLife"
              type="number"
              defaultValue={cat.defaultUsefulLife || 0}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="active" defaultChecked={cat.active} className="rounded border-slate-300" />
            Active
          </label>
          <div className="flex gap-2">
            <Btn type="submit">Save Changes</Btn>
            <Btn href="/categories" variant="secondary">
              Cancel
            </Btn>
          </div>
        </form>
      </Card>
    </div>
  );
}
