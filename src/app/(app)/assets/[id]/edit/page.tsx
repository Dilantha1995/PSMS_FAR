import { PageHeader, Btn } from "@/components/ui";
import { AssetForm } from "@/components/AssetForm";
import { getAllCategories, getAllSubCategories, getAllLocations } from "@/lib/queries";
import { updateAsset } from "@/lib/actions/assets";
import { db } from "@/db";
import { assets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditAssetPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const [asset] = await db.select().from(assets).where(eq(assets.id, id));
  if (!asset) notFound();
  const [cats, subs, locs] = await Promise.all([
    getAllCategories(),
    getAllSubCategories(),
    getAllLocations(),
  ]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Edit Asset"
        subtitle={`${asset.assetTag} — ${asset.name}`}
        action={
          <Btn href={`/assets/${id}`} variant="secondary">
            Back
          </Btn>
        }
      />
      <AssetForm categories={cats} subCategories={subs} locations={locs} action={updateAsset} asset={asset} />
    </div>
  );
}
