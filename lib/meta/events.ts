/**
 * Shared Meta event definitions used by BOTH the browser Pixel wrapper and the
 * server-side Conversions API client, so the two stay in lock-step.
 *
 * `content_ids` convention (documented once, used everywhere):
 *   - When a product variant/option is selected, the id is `"{productId}:{optionId}"`.
 *   - Otherwise it is just `"{productId}"`.
 * This matches the cart item id convention in `stores/cartStore.ts` and keeps the
 * door open for a future product catalog feed that uses the same ids.
 */

export const META_EVENTS = {
  pageView: "PageView",
  viewContent: "ViewContent",
  addToCart: "AddToCart",
  initiateCheckout: "InitiateCheckout",
  purchase: "Purchase"
} as const;

export type MetaEventName = (typeof META_EVENTS)[keyof typeof META_EVENTS];

/** A single line item in Meta's `contents` array. */
export type MetaContent = {
  id: string;
  quantity: number;
  item_price: number;
};

/**
 * Standard custom-data fields. Kept loose (`Record` extension) because Pixel and
 * CAPI both accept additional standard params; these are the ones we populate.
 */
export type MetaCustomData = {
  value?: number;
  currency?: string;
  content_type?: "product" | "product_group";
  content_ids?: string[];
  contents?: MetaContent[];
  num_items?: number;
  content_name?: string;
  content_category?: string;
};

/**
 * Build the content id for a product (optionally with a selected variant),
 * matching the cart item id convention.
 */
export const buildMetaContentId = (productId: string, optionId?: string) =>
  optionId ? `${productId}:${optionId}` : productId;

/** Minimal shape needed to derive Meta `contents` from a cart line. */
export type MetaCartLine = {
  productId: string;
  optionId?: string;
  price: number;
  quantity: number;
};

/**
 * Derive Meta `contents`, `content_ids` and `num_items` from cart lines.
 * Shared by the browser AddToCart / InitiateCheckout / Purchase events so they
 * stay consistent with each other and with the server-side payload.
 */
export const buildMetaContentsFromCart = (lines: MetaCartLine[]) => {
  const contents: MetaContent[] = lines.map((line) => ({
    id: buildMetaContentId(line.productId, line.optionId),
    quantity: line.quantity,
    item_price: line.price
  }));

  return {
    contents,
    content_ids: contents.map((content) => content.id),
    num_items: lines.reduce((total, line) => total + line.quantity, 0)
  };
};
