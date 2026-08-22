export type PayloadMediaReference =
  | {
    id: number | string;
    alt?: null | string;
    height?: null | number;
    mimeType?: null | string;
    url?: null | string;
    filename?: null | string;
    width?: null | number;
  }
  | number
  | string
  | null
  | undefined;

export type PayloadCategoryDocument = {
  id: number | string;
  createdAt: string;
  description: string;
  descriptionAr: string;
  descriptionEn?: string | null;
  headline: string;
  headlineAr: string;
  headlineEn?: string | null;
  image?: PayloadMediaReference;
  name: string;
  nameAr: string;
  nameEn?: string | null;
  collectionLabel?: string | null;
  collectionLabelAr?: string | null;
  collectionLabelEn?: string | null;
  slug: string;
  sortOrder: number;
  updatedAt: string;
};

export type PayloadCategoryReference =
  | ({
    id: number | string;
    name?: null | string;
    nameAr?: null | string;
    nameEn?: null | string;
    slug?: null | string;
  } & Partial<PayloadCategoryDocument>)
  | number
  | string
  | null
  | undefined;

export type PayloadProductOptionRow = {
  id?: string;
  isDefault?: boolean | null;
  label?: null | string;
  labelAr?: null | string;
  labelEn?: null | string;
  originalPrice?: null | number;
  price?: null | number;
};

export type PayloadProductFeatureRow = {
  id?: string;
  text?: null | string;
  textAr?: null | string;
  textEn?: null | string;
};

export type PayloadProductDocument = {
  defaultDeclaredValue?: null | number;
  defaultInsuranceEnabled?: null | boolean;
  defaultStockType?: null | string;
  defaultWeightGrams?: null | number;
  defaultFragile?: null | boolean;
  id: number | string;
  artboardImage?: PayloadMediaReference;
  badge?: null | string;
  badgeAr?: null | string;
  badgeEn?: null | string;
  category: PayloadCategoryReference;
  createdAt: string;
  description?: null | string;
  descriptionAr?: null | string;
  descriptionEn?: null | string;
  displayOriginalPrice?: null | number;
  displayPrice: number;
  featuredRank?: null | number;
  frameColor?: null | string;
  frameShape?: null | string;
  gallery?: null | PayloadMediaReference[];
  gender?: null | string;
  name: string;
  nameAr: string;
  nameEn?: null | string;
  options?: null | PayloadProductOptionRow[];
  pricingMode: "options" | "simple";
  primaryImage?: PayloadMediaReference;
  rating: number;
  reviews: number;
  simpleOriginalPrice?: null | number;
  simplePrice?: null | number;
  slug: string;
  features?: null | PayloadProductFeatureRow[];
  updatedAt: string;
};

export type PayloadProductReviewDocument = {
  id: number | string;
  authorName: string;
  content: string;
  createdAt: string;
  product?:
  | {
    id: number | string;
  }
  | number
  | string
  | null;
  rating: number;
  status: "approved" | "pending" | "rejected";
  submittedAt?: null | string;
  updatedAt: string;
};

export type PayloadShippingProviderDocument = {
  id: number | string;
  apiId?: null | string;
  apiToken?: null | string;
  createdAt: string;
  credentialStatus?: "invalid" | "unchecked" | "valid";
  defaultHeightCm?: null | number;
  defaultLengthCm?: null | number;
  defaultWeightKg?: null | number;
  defaultWidthCm?: null | number;
  enabled: boolean;
  envCredentialPrefix: string;
  family: "custom" | "ecotrack" | "procolis" | "yalidine";
  originWilayaCode?: null | string;
  originWilayaID?: null | number;
  originWilayaName?: null | string;
  slug: string;
  supportsImports?: null | boolean;
  supportsLiveSync?: null | boolean;
  supportsQuotes?: null | boolean;
  supportsWebhooks?: null | boolean;
  title: string;
  trackingURLTemplate?: null | string;
  updatedAt: string;
};

export type PayloadOrderItemSnapshot = {
  id?: string;
  image?: null | string;
  lineTotalMinor?: null | number;
  optionId?: null | string;
  optionLabel?: null | string;
  originalUnitPriceMinor?: null | number;
  productId?: null | string;
  productName?: null | string;
  productSlug?: null | string;
  quantity?: null | number;
  stockType?: null | string;
  unitPriceMinor?: null | number;
  weightGrams?: null | number;
};

export type PayloadOrderDocument = {
  id: number | string;
  assignedCourier?: null | PayloadShippingProviderDocument | number | string;
  confirmationStatus: "confirmed" | "pending" | "rejected" | "unreachable";
  createdAt: string;
  currency: string;
  customerFullName: string;
  customerPhone: string;
  declaredValueMinor?: null | number;
  deliveryAddress?: null | string;
  deliveryCommune: string;
  deliveryMode: "home" | "office";
  deliveryNote?: null | string;
  deliveryPriceMinor: number;
  deliveryStation?: null | string;
  deliveryWilaya: string;
  deliveryWilayaCode?: null | string;
  exchangeNote?: null | string;
  exchangeStatus: "approved" | "completed" | "declined" | "none" | "requested" | "shipped";
  fragile?: null | boolean;
  insuranceEnabled?: null | boolean;
  items?: null | PayloadOrderItemSnapshot[];
  labelURL?: null | string;
  lifecycleStatus:
  | "cancelled"
  | "confirmed"
  | "delivered"
  | "delivery_failed"
  | "in_transit"
  | "new"
  | "preparing"
  | "returned"
  | "submitted_to_courier";
  orderRef: string;
  parcelHeightCm?: null | number;
  parcelLengthCm?: null | number;
  parcelWeightKg?: null | number;
  parcelWidthCm?: null | number;
  paymentStatus: "cancelled" | "paid" | "pending_cod";
  phoneNormalized: string;
  productToChange?: null | string;
  providerOrderID?: null | string;
  rawCourierPayload?: null | Record<string, unknown>;
  rawCourierStatus?: null | string;
  source: "import" | "manual" | "storefront";
  stationCode?: null | string;
  stockType?: null | string;
  submissionKey?: null | string;
  subtotalMinor: number;
  syncedAt?: null | string;
  totalMinor: number;
  trackingNumber?: null | string;
  trackingURL?: null | string;
  updatedAt: string;
};

export type PayloadOrderEventDocument = {
  actorLabel?: null | string;
  actorType: "admin" | "courier" | "customer" | "import" | "system";
  createdAt: string;
  eventType:
  | "confirmation_updated"
  | "courier_assigned"
  | "courier_synced"
  | "created"
  | "exchange_updated"
  | "export_generated"
  | "import_processed"
  | "lifecycle_updated"
  | "note_added"
  | "payment_updated"
  | "shipment_submitted"
  | "tracking_updated"
  | "webhook_processed";
  id: number | string;
  internalMessage?: null | string;
  isPublic?: null | boolean;
  order?: null | PayloadOrderDocument | number | string;
  publicMessage?: null | string;
  updatedAt: string;
};

export type PayloadCourierSyncRunDocument = {
  completedAt?: null | string;
  createdAt: string;
  errorMessage?: null | string;
  id: number | string;
  mapperVersion?: null | string;
  mode: "import" | "poll" | "webhook";
  processedCount?: null | number;
  provider?: null | PayloadShippingProviderDocument | number | string;
  startedAt?: null | string;
  status: "completed" | "failed" | "pending";
  updatedAt: string;
};
