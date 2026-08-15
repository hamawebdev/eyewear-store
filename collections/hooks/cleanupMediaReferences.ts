import type { CollectionBeforeDeleteHook } from "payload";
import { sql } from "drizzle-orm";

/**
 * Nullifies all foreign-key references that point to the media document about
 * to be deleted.
 *
 * **Why this is needed:**
 * Payload's Drizzle adapter creates relationship FK columns with
 * `ON DELETE SET NULL`, but also marks `required` relationships as `NOT NULL`.
 * When PostgreSQL tries to cascade the SET NULL it violates the NOT NULL
 * constraint and the entire DELETE fails with a 500.
 *
 * By clearing the references *before* the row is removed, the FK trigger has
 * nothing left to nullify and the delete succeeds.
 */
export const cleanupMediaReferences: CollectionBeforeDeleteHook = async ({
  id,
  req,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (req.payload.db as any).drizzle;

  await Promise.all([
    // products — single-relation columns
    db.execute(
      sql`UPDATE products SET primary_image_id = NULL WHERE primary_image_id = ${id}`,
    ),
    db.execute(
      sql`UPDATE products SET artboard_image_id = NULL WHERE artboard_image_id = ${id}`,
    ),

    // categories — single-relation columns
    db.execute(
      sql`UPDATE categories SET image_id = NULL WHERE image_id = ${id}`,
    ),
    db.execute(
      sql`UPDATE categories SET background_image_id = NULL WHERE background_image_id = ${id}`,
    ),
  ]);
};
