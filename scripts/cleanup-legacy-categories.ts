/**
 * Removes the pre-Homme/Femme/Enfant/Solaire taxonomy.
 *
 * `seed:catalog` only ever upserts, so after reseeding `categories/catalog.json`
 * the retired categories linger in the database with no products attached. This
 * script deletes them, plus the three accessory products that no longer have a
 * home in the four-category taxonomy.
 *
 * Deletions are explicit rather than "anything missing from the catalog", so a
 * product an admin added by hand in the Payload UI is never swept up by a reseed.
 *
 * Dry run by default — pass `--confirm` to actually delete.
 */
import { loadScriptPayloadClient, type ScriptPayloadClient } from "./payload-script-helpers";

const LEGACY_PRODUCT_SLUGS = ["etui-rigide", "cordon-lunettes", "kit-nettoyage"];

// `kids` is deliberately absent: the new taxonomy reuses that slug, so the
// existing row is updated by the seed rather than deleted and recreated.
const LEGACY_CATEGORY_SLUGS = [
  "sunglasses",
  "optical-frames",
  "blue-light",
  "readers",
  "accessories"
];

type SlugDocument = {
  id: number | string;
  slug?: string;
};

const IS_CONFIRMED = process.argv.includes("--confirm");

const findBySlug = async ({
  collection,
  payload,
  slug
}: {
  collection: string;
  payload: ScriptPayloadClient;
  slug: string;
}): Promise<SlugDocument | null> => {
  const result = (await payload.find({
    collection,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      slug: {
        equals: slug
      }
    }
  })) as { docs: SlugDocument[] };

  return result.docs[0] ?? null;
};

const countProductsInCategory = async ({
  categoryId,
  payload
}: {
  categoryId: number | string;
  payload: ScriptPayloadClient;
}) => {
  const result = await payload.find({
    collection: "products",
    depth: 0,
    limit: 0,
    overrideAccess: true,
    pagination: false,
    where: {
      category: {
        equals: categoryId
      }
    }
  });

  return result.docs.length;
};

async function cleanupLegacyCategories() {
  const payload = await loadScriptPayloadClient();

  if (!IS_CONFIRMED) {
    payload.logger.info("DRY RUN — nothing will be deleted. Re-run with --confirm to apply.");
  }

  for (const slug of LEGACY_PRODUCT_SLUGS) {
    const product = await findBySlug({ collection: "products", payload, slug });

    if (!product) {
      payload.logger.info(`Product ${slug} is already gone.`);
      continue;
    }

    if (!IS_CONFIRMED) {
      payload.logger.info(`Would delete product ${slug}.`);
      continue;
    }

    await payload.delete({
      collection: "products",
      id: product.id,
      overrideAccess: true
    });
    payload.logger.info(`Deleted product ${slug}.`);
  }

  for (const slug of LEGACY_CATEGORY_SLUGS) {
    const category = await findBySlug({ collection: "categories", payload, slug });

    if (!category) {
      payload.logger.info(`Category ${slug} is already gone.`);
      continue;
    }

    const productCount = await countProductsInCategory({ categoryId: category.id, payload });

    if (productCount > 0) {
      // The collection's beforeDelete hook would reject this anyway; failing here
      // says which category is still occupied and by how many products.
      throw new Error(
        `Category ${slug} still has ${productCount} product(s). Run "npm run seed:catalog" first so products move to the new categories.`
      );
    }

    if (!IS_CONFIRMED) {
      payload.logger.info(`Would delete category ${slug}.`);
      continue;
    }

    await payload.delete({
      collection: "categories",
      id: category.id,
      overrideAccess: true
    });
    payload.logger.info(`Deleted category ${slug}.`);
  }

  payload.logger.info(
    IS_CONFIRMED ? "Legacy taxonomy removed." : "Dry run complete — no changes were written."
  );
  process.exit(0);
}

cleanupLegacyCategories().catch((error) => {
  console.error(error);
  process.exit(1);
});
