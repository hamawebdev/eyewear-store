/**
 * Uploads each category's storefront picture from `assets/category-source/` into the
 * Payload media collection and links it to that category.
 *
 * IMPORTANT — where you run this matters. Payload copies the uploaded file into
 * the `media/` upload dir, which in production is the `eyewear-web-media` Docker
 * volume mounted at `/app/media` (see docs/DEPLOYMENT.md). Because local dev and
 * production share one DATABASE_URL, running this on a laptop writes the media
 * *row* to the shared database while the media *file* only ever lands in the
 * local `media/` folder — production would then render a broken image. Run it on
 * the server, inside the web container, so the file lands in the volume.
 *
 * Idempotent: a category that already has both images linked is skipped unless
 * `--force` is passed.
 */
import fs from "node:fs";
import path from "node:path";
import { loadScriptPayloadClient, type ScriptPayloadClient } from "./payload-script-helpers";

type CatalogCategory = {
  image?: string;
  name: { ar: string; en: string; fr: string };
  slug: string;
};

type CatalogDocument = {
  categories: CatalogCategory[];
};

type CategoryDocument = {
  id: number | string;
  image?: unknown;
  slug?: string;
};

type MediaDocument = {
  id: number | string;
};

const CATALOG_PATH = path.resolve(process.cwd(), "categories", "catalog.json");
const IS_FORCED = process.argv.includes("--force");

const findCategoryBySlug = async ({
  payload,
  slug
}: {
  payload: ScriptPayloadClient;
  slug: string;
}): Promise<CategoryDocument | null> => {
  const result = (await payload.find({
    collection: "categories",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      slug: {
        equals: slug
      }
    }
  })) as { docs: CategoryDocument[] };

  return result.docs[0] ?? null;
};

async function uploadCategoryImages() {
  const payload = await loadScriptPayloadClient();
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8")) as CatalogDocument;

  for (const category of catalog.categories) {
    if (!category.image) {
      payload.logger.warn(`Category ${category.slug} has no image in the catalog — skipping.`);
      continue;
    }

    const absoluteFilePath = path.resolve(process.cwd(), category.image);

    if (!fs.existsSync(absoluteFilePath)) {
      throw new Error(`Image for ${category.slug} is missing at ${absoluteFilePath}.`);
    }

    const categoryDoc = await findCategoryBySlug({ payload, slug: category.slug });

    if (!categoryDoc) {
      throw new Error(
        `Category ${category.slug} does not exist yet. Run "npm run seed:catalog" first.`
      );
    }

    if (categoryDoc.image && !IS_FORCED) {
      payload.logger.info(`Category ${category.slug} already has images — skipping.`);
      continue;
    }

    const media = (await payload.create({
      collection: "media",
      data: {
        alt: `${category.name.fr} — lunettes`
      },
      filePath: absoluteFilePath,
      overrideAccess: true
    })) as MediaDocument;

    // Cut-out artwork for the category plate (object-contain). The storefront
    // draws the contact shadow itself, so the file must not carry one.
    await payload.update({
      collection: "categories",
      data: {
        image: media.id
      },
      id: categoryDoc.id,
      overrideAccess: true
    });

    payload.logger.info(`Linked ${path.basename(absoluteFilePath)} to category ${category.slug}.`);
  }

  payload.logger.info("Category images uploaded and linked.");
  process.exit(0);
}

uploadCategoryImages().catch((error) => {
  console.error(error);
  process.exit(1);
});
