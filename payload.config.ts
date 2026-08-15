import path from "node:path";
import { buildConfig, type Payload } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { Admins } from "./collections/admins";
import { ADMIN_COLLECTION_SLUG } from "./collections/access";
import { Categories } from "./collections/categories";
import { Media } from "./collections/media";
import { ProductReviews } from "./collections/product-reviews";
import { Products } from "./collections/products";
import { Wilayas } from "./collections/wilayas";

const getRequiredEnv = (name: string, fallback?: string): string => {
  const value = process.env[name]?.trim();

  if (!value) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error(`${name} is required for the Payload admin setup.`);
  }

  return value;
};

// Use placeholder values during build time (when NODE_ENV is not set or during next build)
// These will be replaced at runtime with actual environment variables
const isBuildTime = process.env.NODE_ENV === "production" && !process.env.DATABASE_URL;
const BUILD_PLACEHOLDER = "build-placeholder-do-not-use-in-production";

const PAYLOAD_SECRET = getRequiredEnv(
  "PAYLOAD_SECRET",
  isBuildTime ? BUILD_PLACEHOLDER : undefined
);
const PAYLOAD_SEED_ADMIN_EMAIL = getRequiredEnv(
  "PAYLOAD_SEED_ADMIN_EMAIL",
  isBuildTime ? "build@placeholder.local" : undefined
);
const PAYLOAD_SEED_ADMIN_PASSWORD = getRequiredEnv(
  "PAYLOAD_SEED_ADMIN_PASSWORD",
  isBuildTime ? BUILD_PLACEHOLDER : undefined
);
const PAYLOAD_SEED_ADMIN_NAME = process.env.PAYLOAD_SEED_ADMIN_NAME?.trim() || "Default Admin";
const DATABASE_URL = process.env.DATABASE_URL?.trim();
const SERVER_URL = process.env.NEXT_PUBLIC_APP_URL?.trim() || "";
const SHOULD_PUSH_SCHEMA = process.env.PAYLOAD_ENABLE_DB_PUSH === "true";
const SHOULD_SKIP_ADMIN_SEED = process.env.PAYLOAD_SKIP_ADMIN_SEED === "true";

const seedAdmin = async (payload: Payload): Promise<void> => {
  // Skip seeding during build time
  if (isBuildTime || SHOULD_SKIP_ADMIN_SEED) {
    return;
  }

  const existingAdmins = await payload.find({
    collection: ADMIN_COLLECTION_SLUG,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      email: {
        equals: PAYLOAD_SEED_ADMIN_EMAIL
      }
    }
  });

  if (existingAdmins.docs.length > 0) {
    return;
  }

  await payload.create({
    collection: ADMIN_COLLECTION_SLUG,
    data: {
      email: PAYLOAD_SEED_ADMIN_EMAIL,
      name: PAYLOAD_SEED_ADMIN_NAME,
      password: PAYLOAD_SEED_ADMIN_PASSWORD
    },
    overrideAccess: true
  });

  payload.logger.info(`Seeded default admin user "${PAYLOAD_SEED_ADMIN_EMAIL}".`);
};

export default buildConfig({
  serverURL: SERVER_URL,
  secret: PAYLOAD_SECRET,
  db: postgresAdapter({
    pool: {
      connectionString: DATABASE_URL
    },
    // Avoid Drizzle dev schema push during Next runtime. It can race or mis-diff
    // Payload's internal lock tables in development and break storefront requests.
    // We enable schema push explicitly for database bootstrap flows like `npm run db:sync`.
    push: SHOULD_PUSH_SCHEMA
  }),
  collections: [Admins, Media, Categories, Products, ProductReviews, Wilayas],
  routes: {
    admin: "/admin",
    api: "/api"
  },
  admin: {
    importMap: {
      baseDir: path.resolve(process.cwd())
    },
    routes: {
      login: "/login"
    },
    user: ADMIN_COLLECTION_SLUG,
    components: {
      views: {
        login: {
          Component: "/components/payload/AdminLoginView",
          exact: true,
          path: "/login"
        }
      }
    }
  },
  typescript: {
    autoGenerate: false
  },
  onInit: async (payload) => {
    await seedAdmin(payload);
  }
});
