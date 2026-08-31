/**
 * Verifies that every product and category still resolves to the right images
 * after `npm run media:backfill`.
 *
 * Runs entirely against the public REST API over HTTPS, so it can be pointed at
 * production from anywhere — it needs neither the database nor the upload
 * volume. That also means it checks what a visitor would actually get rather
 * than what the database claims.
 *
 * Three independent things are checked:
 *
 * 1. **Relationships are intact.** Against a baseline captured before the
 *    backfill, every product's `primaryImage` and its ordered `gallery` must
 *    still point at the same media ids. This is what catches a migration that
 *    silently re-pointed or duplicated references.
 * 2. **Nothing is broken.** Every original and every derivative URL must return
 *    2xx with an image content-type.
 * 3. **The derivatives exist and are smaller.** Each media row must carry all
 *    expected sizes, and `detail` must not be larger than the original.
 *
 *   npm run media:verify
 *   npm run media:verify -- --baseline media-snapshot.json
 *   npm run media:verify -- --site https://herizioptic.com
 */
const DEFAULT_SITE = "https://herizioptic.com";

/** Must match the `name`s in `upload.imageSizes` in collections/media.ts. */
const SIZE_NAMES = ["thumbnail", "card", "detail"] as const;

type MediaSize = {
  filename?: null | string;
  filesize?: null | number;
  height?: null | number;
  url?: null | string;
  width?: null | number;
};

type MediaDoc = {
  filename?: null | string;
  filesize?: null | number;
  height?: null | number;
  id: number;
  sizes?: null | Record<string, MediaSize | null | undefined>;
  url?: null | string;
  width?: null | number;
};

type ProductDoc = {
  gallery?: Array<MediaDoc | number> | null;
  id: number;
  name?: string;
  primaryImage?: MediaDoc | null | number;
  slug?: string;
};

type Baseline = {
  categories_media: Array<{ id: number; image_id: null | number; slug: string }>;
  products_media: Array<{ id: number; primary_image_id: null | number; slug: string }>;
  products_rels: Array<{ media_id: number; order: number; parent_id: number; path: string }>;
};

const getFlag = (name: string) => {
  const index = process.argv.indexOf(`--${name}`);

  return index === -1 ? undefined : process.argv[index + 1];
};

const SITE = (getFlag("site") ?? DEFAULT_SITE).replace(/\/$/, "");

const problems: string[] = [];
const note = (message: string) => problems.push(message);

const toId = (value: MediaDoc | null | number | undefined) => {
  if (value === null || value === undefined) {
    return null;
  }

  return typeof value === "object" ? value.id : value;
};

const fetchAll = async <T>(collection: string, depth: number): Promise<T[]> => {
  const docs: T[] = [];
  let page = 1;

  while (true) {
    const response = await fetch(
      `${SITE}/api/${collection}?limit=100&depth=${depth}&page=${page}&sort=id`
    );

    if (!response.ok) {
      throw new Error(`GET /api/${collection} returned ${response.status}`);
    }

    const body = (await response.json()) as { docs: T[]; hasNextPage: boolean };
    docs.push(...body.docs);

    if (!body.hasNextPage) {
      return docs;
    }

    page += 1;
  }
};

/**
 * Payload stores `url` as an absolute URL built from serverURL. Rewriting it to
 * the configured site keeps the check honest when verifying a non-production
 * host, and mirrors the /api/media/file -> /media rewrite the storefront does.
 */
const toAbsolute = (url: string) => {
  const pathOnly = url.startsWith("http") ? new URL(url).pathname : url;

  return `${SITE}${pathOnly.startsWith("/") ? pathOnly : `/${pathOnly}`}`;
};

const checkUrlResolves = async (label: string, url: string, expectedBytes?: null | number) => {
  let response: Response;

  try {
    response = await fetch(toAbsolute(url));
  } catch (error) {
    note(`${label}: request failed — ${(error as Error).message}`);
    return;
  }

  if (!response.ok) {
    note(`${label}: HTTP ${response.status} for ${url}`);
    return;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.startsWith("image/")) {
    note(`${label}: content-type "${contentType}" is not an image (${url})`);
  }

  const body = await response.arrayBuffer();

  if (body.byteLength === 0) {
    note(`${label}: empty response body (${url})`);
    return;
  }

  // A derivative whose bytes on disk disagree with the recorded filesize means
  // the row and the file have drifted apart.
  if (expectedBytes && body.byteLength !== expectedBytes) {
    note(`${label}: served ${body.byteLength} bytes but the database records ${expectedBytes} (${url})`);
  }
};

const verifyMedia = async (media: MediaDoc[]) => {
  for (const doc of media) {
    const label = `media #${doc.id} (${doc.filename ?? "no filename"})`;

    if (!doc.url) {
      note(`${label}: has no url`);
      continue;
    }

    await checkUrlResolves(`${label} original`, doc.url, doc.filesize ?? null);

    for (const sizeName of SIZE_NAMES) {
      const size = doc.sizes?.[sizeName];

      if (!size?.url) {
        note(`${label}: missing the "${sizeName}" derivative — backfill did not cover this row`);
        continue;
      }

      await checkUrlResolves(`${label} ${sizeName}`, size.url, size.filesize ?? null);

      if (sizeName === "detail" && size.filesize && doc.filesize && size.filesize > doc.filesize) {
        note(
          `${label}: "detail" (${size.filesize}B) is larger than the original (${doc.filesize}B)`
        );
      }
    }
  }
};

const verifyRelationships = async ({
  baseline,
  products
}: {
  baseline: Baseline;
  products: ProductDoc[];
}) => {
  const productsById = new Map(products.map((product) => [product.id, product]));

  for (const expected of baseline.products_media) {
    const product = productsById.get(expected.id);

    if (!product) {
      note(`product #${expected.id} (${expected.slug}) is missing from the API`);
      continue;
    }

    const actualPrimary = toId(product.primaryImage);

    if (actualPrimary !== expected.primary_image_id) {
      note(
        `product #${expected.id} (${expected.slug}): primaryImage is now ${actualPrimary}, was ${expected.primary_image_id}`
      );
    }
  }

  // Gallery order is meaningful on the product page, so compare the sequence,
  // not just the set.
  const expectedGalleries = new Map<number, number[]>();

  for (const rel of baseline.products_rels.filter((row) => row.path === "gallery")) {
    const list = expectedGalleries.get(rel.parent_id) ?? [];
    list.push(rel.media_id);
    expectedGalleries.set(rel.parent_id, list);
  }

  for (const [productId, expectedIds] of expectedGalleries) {
    const product = productsById.get(productId);

    if (!product) {
      continue;
    }

    const actualIds = (product.gallery ?? []).map(toId);
    const matches =
      actualIds.length === expectedIds.length &&
      actualIds.every((id, index) => id === expectedIds[index]);

    if (!matches) {
      note(
        `product #${productId} (${product.slug}): gallery is now [${actualIds.join(", ")}], was [${expectedIds.join(", ")}]`
      );
    }

    const duplicates = actualIds.filter((id, index) => actualIds.indexOf(id) !== index);

    if (duplicates.length > 0) {
      note(`product #${productId} (${product.slug}): gallery has duplicate media ids [${duplicates.join(", ")}]`);
    }
  }
};

const verifyMediaSizes = async () => {
  const baselinePath = getFlag("baseline");

  console.log(`Verifying ${SITE}\n`);

  const [media, products, categories] = await Promise.all([
    fetchAll<MediaDoc>("media", 0),
    fetchAll<ProductDoc>("products", 1),
    fetchAll<{ id: number; image?: MediaDoc | null | number; slug?: string }>("categories", 0)
  ]);

  console.log(
    `Fetched ${media.length} media, ${products.length} products, ${categories.length} categories.`
  );

  await verifyMedia(media);

  if (baselinePath) {
    const baseline = JSON.parse(
      await (await import("node:fs/promises")).readFile(baselinePath, "utf8")
    ) as Baseline;

    await verifyRelationships({ baseline, products });

    for (const expected of baseline.categories_media) {
      const category = categories.find((row) => row.id === expected.id);
      const actual = category ? toId(category.image as MediaDoc | null | number) : null;

      if (actual !== expected.image_id) {
        note(
          `category #${expected.id} (${expected.slug}): image is now ${actual}, was ${expected.image_id}`
        );
      }
    }

    console.log("Compared product and category image references against the baseline.");
  } else {
    console.log("No --baseline given; skipped the relationship comparison.");
  }

  const withAllSizes = media.filter((doc) =>
    SIZE_NAMES.every((name) => doc.sizes?.[name]?.url)
  ).length;

  console.log(`\nMedia with all ${SIZE_NAMES.length} derivatives: ${withAllSizes}/${media.length}`);

  if (problems.length === 0) {
    console.log("\nAll checks passed.");
    return;
  }

  console.log(`\n${problems.length} problem(s):`);
  for (const problem of problems) {
    console.log(`  - ${problem}`);
  }

  throw new Error(`${problems.length} verification problem(s).`);
};

verifyMediaSizes()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
