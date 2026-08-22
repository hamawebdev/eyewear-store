import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // RENAME rather than drop/add: all rows carry label text in three locales,
  // and a drop/add would discard it.
  await db.execute(sql`
   ALTER TABLE "categories" RENAME COLUMN "outlined_pill" TO "collection_label";
  ALTER TABLE "categories" RENAME COLUMN "outlined_pill_ar" TO "collection_label_ar";
  ALTER TABLE "categories" RENAME COLUMN "outlined_pill_en" TO "collection_label_en";
  ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "categories_background_image_id_media_id_fk";
  DROP INDEX IF EXISTS "categories_background_image_idx";
  ALTER TABLE "categories" DROP COLUMN IF EXISTS "background_image_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "categories" RENAME COLUMN "collection_label" TO "outlined_pill";
  ALTER TABLE "categories" RENAME COLUMN "collection_label_ar" TO "outlined_pill_ar";
  ALTER TABLE "categories" RENAME COLUMN "collection_label_en" TO "outlined_pill_en";
  ALTER TABLE "categories" ADD COLUMN "background_image_id" integer;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_background_image_id_media_id_fk" FOREIGN KEY ("background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "categories_background_image_idx" ON "categories" USING btree ("background_image_id");`)
}
