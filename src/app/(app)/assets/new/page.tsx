import { PageHeader, Empty, Btn } from "@/components/ui";
import { AssetForm } from "@/components/AssetForm";
import { getActiveCategories } from "@/lib/queries";
import { createAsset } from "@/lib/actions/assets";

export const dynamic = "force-dynamic";

export default async function NewAssetPage() {
  const cats = await getActiveCategories();
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <PageHeader title="Add Asset" subtitle="Register a new fixed asset" action={<Btn href="/assets" variant="secondary">Back</Btn>} />
      {cats.length === 0 ? (
        <Empty message="Create at least one category first." action={<Btn href="/categories">Go to Categories</Btn>} />
      ) : (
        <AssetForm categories={cats} action={createAsset} />
      )}
    </div>
  );
}
