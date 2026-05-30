import { PageHeader, Empty, Btn } from "@/components/ui";
import { AssetForm } from "@/components/AssetForm";
import { getActiveCategories, getActiveSubCategories, getActiveLocations } from "@/lib/queries";
import { createAsset } from "@/lib/actions/assets";

export const dynamic = "force-dynamic";

export default async function NewAssetPage() {
  const [cats, subs, locs] = await Promise.all([
    getActiveCategories(),
    getActiveSubCategories(),
    getActiveLocations(),
  ]);
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <PageHeader title="Add Asset" subtitle="Register a new fixed asset" action={<Btn href="/assets" variant="secondary">Back</Btn>} />
      {cats.length === 0 ? (
        <Empty message="Create at least one category first." action={<Btn href="/categories">Go to Categories</Btn>} />
      ) : (
        <AssetForm categories={cats} subCategories={subs} locations={locs} action={createAsset} />
      )}
    </div>
  );
}
