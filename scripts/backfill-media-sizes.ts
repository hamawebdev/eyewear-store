/**
 * Generates the `upload.imageSizes` derivatives (thumbnail/card/detail) for media
 * rows that were uploaded before those sizes existed.
 *
 * Payload only builds derivatives during an upload, so the rows already in the
 * collection have all six `sizes_<name>_*` columns NULL after
 * `migrations/20260831_230000_media_image_sizes.ts` runs.
 * lib/storefront-image.server.ts falls back to the 3000px original for those,
 * which is exactly the cost the derivatives exist to remove.
 *
 * Rather than re-implement the resize pipeline, this re-feeds each row's own
 * original file back through `payload.update`. Payload then runs the same code
 * path a fresh upload would — EXIF rotation, focal point, `withoutEnlargement`,
 * the `<base>-<width>x<height>.webp` naming — so a backfilled row is
 * indistinguishable from a freshly uploaded one.
 *
 * IMPORTANT — where you run this matters. Payload writes the derivatives into
 * the `media/` upload dir, which in production is the `eyewear-web-media` Docker
 * volume mounted at `/app/media` (see docs/DEPLOYMENT.md). Because local dev and
 * production share one DATABASE_URL, running this on a laptop writes the
 * `sizes_*` columns to the shared database while the derivative *files* only
 * ever land in the local `media/` folder — production would then serve 404s for
 * every derivative URL. Run it on the server, inside the web container.
 *
 * The original file is never modified: the same bytes are re-uploaded under the
 * same filename (`overwriteExistingFiles`), so `url`, `filename`, `width`,
 * `height` and `filesize` on the base document are unchanged and every
 * product/category relationship — which points at the media *id* — is untouched.
 *
 * Idempotent: a row whose derivatives are all present on disk is skipped unless
 * `--force` is passed.
 *
 *   npm run media:backfill -- --dry-run     # report only, writes nothing
 *   npm run media:backfill -- --only 20,21  # limit to specific media ids
 *   npm run media:backfill -- --force       # rebuild derivatives that exist
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadScriptPayloadClient, type ScriptPayloadClient } from "./payload-script-helpers";

const MEDIA_DIR = path.resolve(process.cwd(), "media");

/** Must match the `name`s in `upload.imageSizes` in collections/media.ts. */
const SIZE_NAMES = ["thumbnail", "card", "detail"] as const;

const IS_DRY_RUN = process.argv.includes("--dry-run");
const IS_FORCED = process.argv.includes("--force");

type MediaSize = {
  filename?: null | string;
  filesize?: null | number;
  height?: null | number;
  width?: null | number;
};

type MediaDocument = {
  filename?: null | string;
  id: number | string;
  sizes?: null | Record<string, MediaSize | null | undefined>;
};

type Outcome = {
  detail: string;
  id: number | string;
  filename: string;
  status: "failed" | "missing-file" | "rebuilt" | "skipped";
};

const getRequestedIds = (): Set<string> | null => {
  const flagIndex = process.argv.indexOf("--only");

  if (flagIndex === -1) {
    return null;
  }

  const raw = process.argv[flagIndex + 1];

  if (!raw) {
    throw new Error("--only needs a comma-separated list of media ids.");
  }

  return new Set(
    raw
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  );
};

const getSizeFilenames = (doc: MediaDocument) =>
  SIZE_NAMES.map((name) => doc.sizes?.[name]?.filename ?? null);

/**
 * A row counts as backfilled only when every size is recorded in the database
 * *and* still present on disk. Checking the columns alone would skip rows whose
 * files were lost with a volume, which is precisely when a rebuild is wanted.
 */
const isAlreadyBackfilled = (doc: MediaDocument) => {
  const filenames = getSizeFilenames(doc);

  if (filenames.some((filename) => !filename)) {
    return false;
  }

  return filenames.every((filename) => fs.existsSync(path.join(MEDIA_DIR, filename as string)));
};

const describeSizes = (doc: MediaDocument) =>
  SIZE_NAMES.map((name) => {
    const size = doc.sizes?.[name];

    if (!size?.filename) {
      return `${name}=omitted`;
    }

    return `${name}=${size.width}x${size.height}/${Math.round((size.filesize ?? 0) / 1024)}KB`;
  }).join(" ");

/**
 * Payload deletes the document's existing files before writing the replacements,
 * and the source we hand it is that very file. Copying it outside MEDIA_DIR
 * first removes the aliasing entirely, so a failure mid-update can never leave
 * the row without its original.
 */
const withTempCopy = async <T>(
  sourcePath: string,
  filename: string,
  run: (tempPath: string) => Promise<T>
): Promise<T> => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "media-backfill-"));
  const tempPath = path.join(tempDir, filename);

  try {
    fs.copyFileSync(sourcePath, tempPath);

    return await run(tempPath);
  } finally {
    fs.rmSync(tempDir, { force: true, recursive: true });
  }
};

const rebuildSizes = async ({
  doc,
  payload
}: {
  doc: MediaDocument;
  payload: ScriptPayloadClient;
}): Promise<MediaDocument> => {
  const filename = doc.filename as string;
  const originalPath = path.join(MEDIA_DIR, filename);

  return withTempCopy(originalPath, filename, async (tempPath) =>
    (await payload.update({
      collection: "media",
      // No field changes — the file alone drives the resize pipeline.
      data: {},
      depth: 0,
      filePath: tempPath,
      id: doc.id,
      overrideAccess: true,
      // Keeps the original filename instead of Payload appending "-1", so every
      // stored `url` stays valid and re-running the script stays idempotent.
      overwriteExistingFiles: true
    })) as MediaDocument
  );
};

const backfillMediaSizes = async () => {
  const requestedIds = getRequestedIds();

  // Checked before Payload connects: on a laptop the database is the shared
  // production one, and there is no reason to open that connection at all when
  // the upload dir this script exists to write into is not even mounted.
  if (!fs.existsSync(MEDIA_DIR)) {
    throw new Error(
      `No media directory at ${MEDIA_DIR}. Run this inside the web container, where the eyewear-web-media volume is mounted.`
    );
  }

  const payload = await loadScriptPayloadClient();

  const result = await payload.find({
    collection: "media",
    depth: 0,
    limit: 0,
    overrideAccess: true,
    pagination: false,
    sort: "id"
  });

  const allDocs = result.docs as MediaDocument[];
  const docs = requestedIds
    ? allDocs.filter((doc) => requestedIds.has(String(doc.id)))
    : allDocs;

  if (requestedIds) {
    const found = new Set(docs.map((doc) => String(doc.id)));
    const missing = [...requestedIds].filter((id) => !found.has(id));

    if (missing.length > 0) {
      throw new Error(`No media document for id(s): ${missing.join(", ")}`);
    }
  }

  payload.logger.info(
    `Backfilling image sizes for ${docs.length} media document(s)${IS_DRY_RUN ? " (dry run)" : ""}.`
  );

  const outcomes: Outcome[] = [];

  // Deliberately sequential: the web container is capped at 1.5GB (see
  // docs/DEPLOYMENT.md) and each resize decodes a 3000px source while the app is
  // still serving traffic.
  for (const doc of docs) {
    const filename = doc.filename?.trim();

    if (!filename) {
      outcomes.push({
        detail: "document has no filename",
        filename: "(none)",
        id: doc.id,
        status: "failed"
      });
      continue;
    }

    const originalPath = path.join(MEDIA_DIR, filename);

    if (!fs.existsSync(originalPath)) {
      outcomes.push({
        detail: "original file missing from the upload dir",
        filename,
        id: doc.id,
        status: "missing-file"
      });
      continue;
    }

    if (!IS_FORCED && isAlreadyBackfilled(doc)) {
      outcomes.push({ detail: describeSizes(doc), filename, id: doc.id, status: "skipped" });
      continue;
    }

    if (IS_DRY_RUN) {
      outcomes.push({ detail: "would rebuild", filename, id: doc.id, status: "rebuilt" });
      continue;
    }

    try {
      const updated = await rebuildSizes({ doc, payload });
      const written = getSizeFilenames(updated).filter(Boolean).length;

      if (written === 0) {
        throw new Error("update produced no image sizes");
      }

      outcomes.push({ detail: describeSizes(updated), filename, id: doc.id, status: "rebuilt" });
      payload.logger.info(`  #${doc.id} ${filename} — ${describeSizes(updated)}`);
    } catch (error) {
      outcomes.push({
        detail: error instanceof Error ? error.message : String(error),
        filename,
        id: doc.id,
        status: "failed"
      });
    }
  }

  const countOf = (status: Outcome["status"]) =>
    outcomes.filter((outcome) => outcome.status === status).length;

  payload.logger.info(
    `Done. rebuilt=${countOf("rebuilt")} skipped=${countOf("skipped")} missing-file=${countOf("missing-file")} failed=${countOf("failed")}`
  );

  const problems = outcomes.filter(
    (outcome) => outcome.status === "failed" || outcome.status === "missing-file"
  );

  for (const problem of problems) {
    payload.logger.warn(`  #${problem.id} ${problem.filename} — ${problem.status}: ${problem.detail}`);
  }

  if (problems.length > 0) {
    throw new Error(`${problems.length} media document(s) could not be backfilled.`);
  }
};

backfillMediaSizes()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
