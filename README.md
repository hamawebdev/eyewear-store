# Herizi

An e-commerce platform for **Herizi** (حريزي), a ready-to-wear eyewear brand based in Algeria. The store sells sunglasses, optical frames, blue-light glasses, reading glasses, kids' eyewear and accessories, with cash-on-delivery shipping across the wilayas.

## About Herizi

**Herizi** (حريزي) sells ready-to-wear eyewear: no prescription fitting, no lens grinding. Optical frames are sold on their own with demo lenses so customers can have their own lenses fitted by an optician, and reading glasses are sold by dioptre strength.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 15.4 (App Router, Turbopack) |
| **CMS/Backend** | Payload CMS 3.x |
| **Database** | PostgreSQL |
| **Styling** | Tailwind CSS 4 + Radix UI components |
| **Language** | TypeScript |
| **Analytics** | Meta Pixel + Conversions API |
| **Shipping** | Per-wilaya rates, cash on delivery |
| **State Management** | Zustand |
| **Animation** | Framer Motion, GSAP |
| **Validation** | Zod + React Hook Form |

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── [locale]/           # Localized storefront (ar, fr, en)
│   ├── (payload)/          # Admin routes
│   └── layout.tsx          # Root layout, metadata, Organization JSON-LD
├── collections/            # Payload CMS collections
│   ├── admins.ts           # Admin users
│   ├── categories.ts       # Product categories (trilingual)
│   ├── products.ts         # Products, pricing and eyewear attributes
│   ├── product-reviews.ts  # Customer reviews
│   ├── wilayas.ts          # Algerian states for shipping
│   └── media.ts            # File uploads
├── components/             # Reusable React components
├── lib/
│   ├── brand.ts            # Brand name and contact details — edit this first
│   ├── eyewear.ts          # Frame shape / fit / colour vocabularies
│   ├── storefront-copy.ts  # The full ar/fr/en copy dictionary
│   ├── seo.ts              # Per-page metadata + hreflang helper
│   └── payload/            # Server-side Payload helpers
├── categories/catalog.json # Seed catalogue (6 categories, 29 products)
└── scripts/                # Database seeding & admin utilities
```

## Features

- **Multilingual storefront** — Arabic (default, RTL), French, and English
- **Dual pricing model** — a single price, or variants (colour, dioptre strength)
- **Eyewear filters** — frame shape, fit, colour, category and DZD price bands
- **Product reviews** — customer ratings with an admin approval workflow
- **Delivery coverage** — per-wilaya rates, home delivery or desk pickup
- **Admin dashboard** — Payload admin with Google Sheets order sync
- **SEO** — per-page metadata, hreflang, Product/Organization JSON-LD, dynamic sitemap

## Before going live

1. Fill in `lib/brand.ts` — the email, phone numbers and WhatsApp number are intentionally
   empty, and each contact affordance stays hidden until you set them.
2. Set `NEXT_PUBLIC_APP_URL` to the real domain (it drives canonical URLs, hreflang and the sitemap).
3. Add the new `facebook-domain-verification` meta tag in `app/layout.tsx` and set the new
   Meta Pixel / CAPI credentials.
4. Replace the placeholder brand assets: `public/logo.svg`, `app/icon.svg`, the hero video
   (`public/output*.mp4|webm`) and its posters.
5. Upload product images through the Payload admin and attach them to each product.

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Type-check (required: next.config.ts ignores TS errors during build)
npx tsc --noEmit

# Lint code
npm run lint

# Build for production
npm run build
```

### Database Setup

```bash
# Sync schema with database
npm run db:sync

# Seed wilayas (Algerian states)
npm run seed:wilayas

# Seed product catalog
npm run seed:catalog

# Reset database — DESTRUCTIVE, drops the whole public schema
npm run db:reset

# Reset and reseed in one go
bash scripts/reset-and-seed.sh
```

### Environment Variables

```env
PAYLOAD_SECRET=
DATABASE_URL=postgresql://user:pass@host:5432/db
PAYLOAD_SEED_ADMIN_EMAIL=
PAYLOAD_SEED_ADMIN_PASSWORD=
PAYLOAD_SEED_ADMIN_NAME=
NEXT_PUBLIC_APP_URL=
GOOGLE_SHEETS_WEBHOOK_URL=
GOOGLE_SHEETS_WEBHOOK_SECRET=
NEXT_PUBLIC_STORE_CURRENCY=DZD
NEXT_PUBLIC_META_PIXEL_ID=
META_CAPI_ACCESS_TOKEN=
META_CAPI_PIXEL_ID=
```

## License

Private project for the Herizi eyewear store.
