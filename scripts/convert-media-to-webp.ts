/**
 * Converts EXISTING media files to WebP, in place in the media volume.
 *
 * New uploads are already handled by `upload.formatOptions` in
 * `collections/media.ts` — this script is only for the backlog that predates it.
 *
 * SAFETY MODEL
 * ------------
 * Converting `photo.jpg` to `photo.webp` changes the media document's
 * `filename`, and therefore its public URL. Those URLs are served with
 * `Cache-Control: immutable, max-age=31536000` (see next.config.ts), so a
 * visitor, CDN, Meta catalogue or search index may hold the old one for up to a
 * year. To make that safe, this script NEVER deletes the source file: the old
 * `photo.jpg` stays on disk and keeps resolving, while the database points at
 * the new `photo.webp`. Nothing 404s.
 *
 * Prune the leftover originals only once you are satisfied nothing requests
 * them any more — that is a separate, deliberate step, not part of this script.
 *
 * DRY RUN BY DEFAULT
 * ------------------
 *   tsx scripts/convert-media-to-webp.ts            # report only, writes nothing
 *   tsx scripts/convert-media-to-webp.ts --apply    # actually convert
 *
 * WHERE TO RUN IT
 * ---------------
 * On the server, against the `eyewear-web-media` volume. Running it on a laptop
 * would rewrite the shared database's filenames while the converted files land
 * only in a local `media/` folder — production would then 404 every row it
 * touched. This is the same constraint documented in upload-category-images.ts.
 *
 * Idempotent: rows already stored as WebP are skipped, so it is safe to re-run.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { loadScriptPayloadClient, type ScriptPayloadClient } from "./payload-script-helpers";

const MEDIA_DIR = path.resolve(process.cwd(), "media");
const IS_APPLY = process.argv.includes("--apply");

/** Kept in sync with `upload.formatOptions` / `resizeOptions` in collections/media.ts. */
const WEBP_QUALITY = 80;
const MAX_EDGE = 2400;

/** Payload's own canResizeImage() list. SVG is deliberately absent. */
const CONVERTIBLE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/tiff",
  "image/avif"
]);

type MediaDocument = {
  id: number | string;
  filename?: string;
  filesize?: number;
  height?: number;
  mimeType?: string;
  width?: number;
};

const formatKb = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`;

const findAllMedia = async (payload: ScriptPayloadClient): Promise<MediaDocument[]> => {
  const result = await payload.find({
    collection: "media",
    depth: 0,
    limit: 0,
    overrideAccess: true,
    pagination: false
  });

  return result.docs as MediaDocument[];
};

const run = async () => {
  const payload = await loadScriptPayloadClient();

  if (!fs.existsSync(MEDIA_DIR)) {
    payload.logger.warn(`No media directory at ${MEDIA_DIR} — nothing to convert.`);
    return;
  }

  const docs = await findAllMedia(payload);
  payload.logger.info(
    `${IS_APPLY ? "APPLY" : "DRY RUN"} — ${docs.length} media document(s) found in ${MEDIA_DIR}`
  );

  let converted = 0;
  let skipped = 0;
  let failed = 0;
  let bytesBefore = 0;
  let bytesAfter = 0;

  for (const doc of docs) {
    const label = doc.filename ?? `#${doc.id}`;

    if (!doc.filename) {
      payload.logger.warn(`  SKIP ${label} — document has no filename`);
      skipped += 1;
      continue;
    }

    if (doc.mimeType === "image/webp") {
      skipped += 1;
      continue;
    }

    if (!doc.mimeType || !CONVERTIBLE_MIME_TYPES.has(doc.mimeType)) {
      payload.logger.info(`  SKIP ${label} — ${doc.mimeType ?? "unknown type"} is not converted`);
      skipped += 1;
      continue;
    }

    const sourcePath = path.join(MEDIA_DIR, path.basename(doc.filename));

    if (!fs.existsSync(sourcePath)) {
      payload.logger.warn(`  MISS ${label} — no file on disk at ${sourcePath}`);
      failed += 1;
      continue;
    }

    const targetName = `${path.basename(doc.filename, path.extname(doc.filename))}.webp`;
    const targetPath = path.join(MEDIA_DIR, targetName);

    // A different document may already own this name. Renaming into it would
    // make two rows point at one file, and deleting either would break the other.
    const collision = docs.find(
      (other) => other.id !== doc.id && other.filename === targetName
    );

    if (collision) {
      payload.logger.warn(
        `  SKIP ${label} — "${targetName}" is already used by media #${collision.id}`
      );
      skipped += 1;
      continue;
    }

    try {
      const sourceSize = fs.statSync(sourcePath).size;
      const output = await sharp(sourcePath)
        .rotate()
        .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer({ resolveWithObject: true });

      bytesBefore += sourceSize;
      bytesAfter += output.info.size;

      const saving = ((1 - output.info.size / sourceSize) * 100).toFixed(0);
      payload.logger.info(
        `  ${IS_APPLY ? "CONVERT" : "WOULD CONVERT"} ${label} -> ${targetName}  ` +
          `${formatKb(sourceSize)} -> ${formatKb(output.info.size)} (${saving}% smaller), ` +
          `${output.info.width}x${output.info.height}`
      );

      if (IS_APPLY) {
        fs.writeFileSync(targetPath, output.data);

        await payload.update({
          collection: "media",
          id: doc.id,
          data: {
            filename: targetName,
            filesize: output.info.size,
            height: output.info.height,
            mimeType: "image/webp",
            width: output.info.width
          },
          overrideAccess: true
        });

        // The source file is intentionally left in place so the pre-conversion
        // URL keeps resolving for anything holding a cached copy.
      }

      converted += 1;
    } catch (error) {
      payload.logger.warn(`  FAIL ${label} — ${(error as Error).message}`);
      failed += 1;
    }
  }

  payload.logger.info(
    `\n${IS_APPLY ? "Applied" : "Dry run"}: ${converted} converted, ${skipped} skipped, ${failed} failed.`
  );

  if (converted > 0) {
    payload.logger.info(
      `Converted bytes: ${formatKb(bytesBefore)} -> ${formatKb(bytesAfter)} ` +
        `(${((1 - bytesAfter / bytesBefore) * 100).toFixed(0)}% smaller). ` +
        `Originals kept on disk as fallbacks.`
    );
  }

  if (!IS_APPLY && converted > 0) {
    payload.logger.info("Nothing was written. Re-run with --apply to perform the conversion.");
  }
};

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
