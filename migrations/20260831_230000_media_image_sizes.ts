import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds the columns behind `upload.imageSizes` in collections/media.ts.
 *
 * Payload stores each size as a `sizes.<name>` group of url/width/height/
 * mimeType/filesize/filename, which the Postgres adapter flattens to
 * `sizes_<name>_<field>` in snake_case — matching the base `mime_type` column
 * already on this table.
 *
 * These stay nullable: rows uploaded before this migration have no derivatives
 * until `npm run media:backfill` regenerates them, and
 * lib/storefront-image.server.ts falls back to the original file meanwhile.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" ADD COLUMN "sizes_thumbnail_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_thumbnail_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_thumbnail_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_thumbnail_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_thumbnail_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_thumbnail_filename" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_card_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_card_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_card_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_card_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_card_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_card_filename" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_detail_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_detail_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_detail_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_detail_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_detail_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_detail_filename" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_thumbnail_url";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_thumbnail_width";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_thumbnail_height";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_thumbnail_mime_type";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_thumbnail_filesize";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_thumbnail_filename";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_card_url";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_card_width";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_card_height";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_card_mime_type";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_card_filesize";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_card_filename";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_detail_url";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_detail_width";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_detail_height";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_detail_mime_type";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_detail_filesize";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_detail_filename";`)
}
