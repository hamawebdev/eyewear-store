/**
 * Standalone category seed.
 *
 * Owns the four storefront categories outright — the copy below is the source
 * of truth for this script and it reads nothing from categories/catalog.json,
 * so it can run without the product catalog being in any particular state.
 *
 * Default mode creates the four categories, matching on slug: missing ones are
 * created, existing ones are updated in place. Ids survive, so products keep
 * whatever category they already point at and nothing else has to be touched.
 * Legacy categories in LEGACY_SLUGS are removed when nothing references them,
 * and skipped with a warning when something still does.
 *
 *   npm run seed:categories:fresh
 *
 * --recreate deletes the categories and builds them from scratch instead, so
 * they come back with new ids. That is only safe on a database where no
 * product references them yet — collections/categories.ts blocks the delete of
 * an in-use category (by id or by slug), so the script checks first and
 * refuses to start rather than failing halfway and stranding the taxonomy.
 * Being destructive, it also needs --confirm; without it you get the plan.
 *
 *   npm run seed:categories:fresh -- --recreate            # dry run
 *   npm run seed:categories:fresh -- --recreate --confirm  # actually writes
 *
 * Images are deliberately not handled here; `image` is left unset and the
 * storefront falls back to its placeholder.
 */
import { loadScriptPayloadClient, type ScriptPayloadClient } from "./payload-script-helpers";

type CategorySeed = {
  collectionLabel: { ar: string; en: string; fr: string };
  description: { ar: string; en: string; fr: string };
  headline: { ar: string; en: string; fr: string };
  name: { ar: string; en: string; fr: string };
  slug: string;
};

const CATEGORIES: CategorySeed[] = [
  {
    slug: "men",
    name: { fr: "Homme", ar: "رجال", en: "Men" },
    headline: { fr: "Lignes\nnettes", ar: "خطوط\nواضحة", en: "Clean\nlines" },
    collectionLabel: {
      fr: "Collection homme",
      ar: "تشكيلة الرجال",
      en: "Men's collection"
    },
    description: {
      fr: "Des montures larges et structurées, taillées pour les visages masculins et pensées pour tenir du bureau au plein soleil.",
      ar: "إطارات عريضة ومهيكلة، مصممة لملامح الرجال لتصمد من المكتب إلى الشمس الساطعة.",
      en: "Wide, structured frames cut for men's faces and built to hold up from the office to full sun."
    }
  },
  {
    slug: "women",
    name: { fr: "Femme", ar: "نساء", en: "Women" },
    headline: { fr: "Regard\naffirmé", ar: "إطلالة\nواثقة", en: "A confident\nlook" },
    collectionLabel: {
      fr: "Collection femme",
      ar: "تشكيلة النساء",
      en: "Women's collection"
    },
    description: {
      fr: "Œil de chat, formes rondes et acétates fins : des montures légères qui affinent le regard sans jamais l'alourdir.",
      ar: "عين القطة، أشكال دائرية وأسيتات رفيع: إطارات خفيفة تبرز العينين دون أن تثقلهما.",
      en: "Cat-eye, round shapes and slim acetates: light frames that sharpen the eyes without ever weighing them down."
    }
  },
  {
    slug: "kids",
    name: { fr: "Enfant", ar: "أطفال", en: "Kids" },
    headline: { fr: "Solide,\net léger", ar: "متين\nوخفيف", en: "Tough,\nand light" },
    collectionLabel: {
      fr: "Collection enfant",
      ar: "تشكيلة الأطفال",
      en: "Kids collection"
    },
    description: {
      fr: "Des montures flexibles qui encaissent la cour de récréation, avec des verres protecteurs et des branches qui ne glissent pas.",
      ar: "إطارات مرنة تتحمل ساحة المدرسة، مع عدسات واقية وأذرع لا تنزلق.",
      en: "Flexible frames that survive the playground, with protective lenses and temples that stay put."
    }
  },
  {
    slug: "solaire",
    name: { fr: "Solaire", ar: "نظارات شمسية", en: "Sunglasses" },
    headline: { fr: "Soleil\nmaîtrisé", ar: "شمس\nتحت السيطرة", en: "Sun,\ntamed" },
    collectionLabel: {
      fr: "Collection solaire",
      ar: "تشكيلة النظارات الشمسية",
      en: "Sun collection"
    },
    description: {
      fr: "Des solaires filtrant 100 % des UVA et UVB, choisies pour tenir la lumière forte de l'été algérien sans sacrifier le style.",
      ar: "نظارات شمسية تحجب 100% من الأشعة فوق البنفسجية، مختارة لتصمد أمام شمس الجزائر القوية دون التنازل عن الأناقة.",
      en: "Sunglasses that block 100% of UVA and UVB rays, picked to handle a strong Algerian summer without giving up on style."
    }
  }
];

/** Pre-existing categories this seed replaces. Deleted, never recreated. */
const LEGACY_SLUGS = [
  "sunglasses",
  "optical-frames",
  "blue-light",
  "readers",
  "accessories"
];

const IS_CONFIRMED = process.argv.includes("--confirm");
const IS_RECREATE = process.argv.includes("--recreate");

type CategoryRow = { id: number | string; name?: string; slug?: string };
type ProductRow = {
  category?: { id?: number | string } | number | string | null;
  id: number | string;
  name?: string;
};

const categoryRefOf = (product: ProductRow) => {
  const { category } = product;

  if (category && typeof category === "object") {
    return category.id ?? null;
  }

  return category ?? null;
};

const findCategories = async (payload: ScriptPayloadClient) =>
  (
    (await payload.find({
      collection: "categories",
      depth: 0,
      overrideAccess: true,
      pagination: false,
      sort: "sortOrder"
    })) as { docs: CategoryRow[] }
  ).docs;

const findProducts = async (payload: ScriptPayloadClient) =>
  (
    (await payload.find({
      collection: "products",
      depth: 0,
      overrideAccess: true,
      pagination: false
    })) as { docs: ProductRow[] }
  ).docs;

const fieldsFor = (entry: CategorySeed, index: number) => ({
  collectionLabel: entry.collectionLabel.fr,
  collectionLabelAr: entry.collectionLabel.ar,
  collectionLabelEn: entry.collectionLabel.en,
  description: entry.description.fr,
  descriptionAr: entry.description.ar,
  descriptionEn: entry.description.en,
  headline: entry.headline.fr,
  headlineAr: entry.headline.ar,
  headlineEn: entry.headline.en,
  name: entry.name.fr,
  nameAr: entry.name.ar,
  nameEn: entry.name.en,
  slug: entry.slug,
  sortOrder: index + 1
});

/**
 * Products that point at any of `rows`, keyed by category slug. A product can
 * reference its category by id or by slug, so both are matched.
 */
const referencesTo = (rows: CategoryRow[], products: ProductRow[]) => {
  const keys = new Map<string, string>();

  for (const row of rows) {
    const slug = row.slug ?? String(row.id);

    keys.set(String(row.id), slug);

    if (row.slug) {
      keys.set(row.slug, slug);
    }
  }

  const found = new Map<string, ProductRow[]>();

  for (const product of products) {
    const ref = categoryRefOf(product);
    const slug = ref === null ? undefined : keys.get(String(ref));

    if (slug) {
      found.set(slug, [...(found.get(slug) ?? []), product]);
    }
  }

  return found;
};

const describe = (rows: ProductRow[]) => {
  const sample = rows
    .slice(0, 5)
    .map((row) => `#${row.id} ${row.name ?? "(unnamed)"}`)
    .join(", ");

  return rows.length > 5 ? `${sample}, +${rows.length - 5} more` : sample;
};

/**
 * Delete the four and build them again from scratch. Only viable before any
 * product references them, since every category comes back with a new id.
 */
async function recreate(payload: ScriptPayloadClient, existing: CategoryRow[]) {
  const managed = new Set([...CATEGORIES.map((entry) => entry.slug), ...LEGACY_SLUGS]);
  const toDelete = existing.filter((row) => row.slug && managed.has(row.slug));
  const products = await findProducts(payload);
  const blocking = referencesTo(toDelete, products);

  if (blocking.size > 0) {
    const count = [...blocking.values()].reduce((sum, rows) => sum + rows.length, 0);

    payload.logger.warn(
      `Refusing to run: ${count} product(s) still reference ${blocking.size} of the categories --recreate deletes.`
    );

    for (const [slug, rows] of blocking) {
      payload.logger.warn(`  ${slug}: ${rows.length} product(s) — ${describe(rows)}`);
    }

    payload.logger.warn(
      "Recreating assigns new ids, so those links cannot be carried over. Run without --recreate to update the categories in place instead."
    );
    process.exit(1);
  }

  if (!IS_CONFIRMED) {
    payload.logger.info("Dry run — add --confirm to apply. Planned changes:");

    for (const row of toDelete) {
      payload.logger.info(`  delete  ${row.slug} (#${row.id}) ${row.name ?? ""}`);
    }

    for (const [index, entry] of CATEGORIES.entries()) {
      payload.logger.info(`  create  ${entry.slug} (sortOrder ${index + 1}) ${entry.name.fr}`);
    }

    process.exit(0);
  }

  for (const row of toDelete) {
    await payload.delete({ collection: "categories", id: row.id, overrideAccess: true });
    payload.logger.info(`Deleted category ${row.slug}`);
  }

  for (const [index, entry] of CATEGORIES.entries()) {
    await payload.create({
      collection: "categories",
      data: fieldsFor(entry, index),
      overrideAccess: true
    });
    payload.logger.info(`Created category ${entry.slug}`);
  }
}

/**
 * Match on slug: create what is missing, update what is already there. Ids are
 * preserved, so existing product links keep working.
 */
async function upsert(payload: ScriptPayloadClient, existing: CategoryRow[]) {
  const bySlug = new Map(
    existing.filter((row): row is CategoryRow & { slug: string } => Boolean(row.slug)).map((row) => [row.slug, row])
  );

  for (const [index, entry] of CATEGORIES.entries()) {
    const current = bySlug.get(entry.slug);

    if (current) {
      await payload.update({
        collection: "categories",
        data: fieldsFor(entry, index),
        id: current.id,
        overrideAccess: true
      });
      payload.logger.info(`Updated category ${entry.slug} (#${current.id})`);
      continue;
    }

    await payload.create({
      collection: "categories",
      data: fieldsFor(entry, index),
      overrideAccess: true
    });
    payload.logger.info(`Created category ${entry.slug}`);
  }

  const legacy = LEGACY_SLUGS.map((slug) => bySlug.get(slug)).filter(
    (row): row is CategoryRow & { slug: string } => Boolean(row)
  );

  if (legacy.length === 0) {
    return;
  }

  const inUse = referencesTo(legacy, await findProducts(payload));

  for (const row of legacy) {
    const blocking = inUse.get(row.slug);

    if (blocking) {
      payload.logger.warn(
        `Kept legacy category ${row.slug}: ${blocking.length} product(s) still reference it — ${describe(blocking)}`
      );
      continue;
    }

    await payload.delete({ collection: "categories", id: row.id, overrideAccess: true });
    payload.logger.info(`Deleted legacy category ${row.slug}`);
  }
}

async function seedCategories() {
  const payload = await loadScriptPayloadClient();
  const existing = await findCategories(payload);

  payload.logger.info(
    `Found ${existing.length} categories; seeding ${CATEGORIES.length}${IS_RECREATE ? " via --recreate" : ""}.`
  );

  if (IS_RECREATE) {
    await recreate(payload, existing);
  } else {
    await upsert(payload, existing);
  }

  payload.logger.info(`Seeded ${CATEGORIES.length} categories.`);
  process.exit(0);
}

seedCategories().catch((error) => {
  console.error(error);
  process.exit(1);
});
