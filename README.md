# Fusion Piercings

E-commerce storefront, appointment booking, and admin dashboard for **Fusion Piercings** — a piercing studio and body-jewelry brand operating in Zgharta and Batroun (North Lebanon) and Adma (Mount Lebanon). Customers browse jewelry, place **Cash on Delivery (COD)** orders, and request piercing appointments via WhatsApp; the owner manages catalog, inventory, and orders from a password-gated dashboard.

This repository is a **monorepo** containing two independently deployed applications:

| App | Path | Stack | Hosted on |
|-----|------|-------|-----------|
| Storefront + Admin UI | `fusion-piercings-frontend/` | Next.js 14 (App Router) | Cloudflare Pages |
| REST API | `fusion-piercings-backend/` | Node.js + Express 5 | Render |
| Database + Image storage | — | Supabase (PostgreSQL + Storage) | Supabase |

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Key Features](#key-features)
3. [Tech Stack](#tech-stack)
4. [System Architecture](#system-architecture)
5. [Folder Structure](#folder-structure)
6. [Database Design](#database-design)
7. [Authentication & Authorization](#authentication--authorization)
8. [API Architecture & Integrations](#api-architecture--integrations)
9. [Core User Flows & Business Logic](#core-user-flows--business-logic)
10. [Admin Dashboard](#admin-dashboard)
11. [Security Considerations](#security-considerations)
12. [Environment Variables](#environment-variables)
13. [Local Development Setup](#local-development-setup)
14. [Build & Deployment](#build--deployment)
15. [Known Limitations & Future Improvements](#known-limitations--future-improvements)
16. [Troubleshooting](#troubleshooting)

---

## Project Overview

Fusion Piercings is a single-brand, single-currency (USD) **direct-to-consumer** site built around the realities of a small Lebanese retail business:

- **Cash on Delivery only** — there is no online payment gateway. The owner confirms each order by phone/WhatsApp and collects cash on delivery. This shapes several design decisions (e.g. duplicate-order prevention matters more than payment-failure handling).
- **WhatsApp-first communication** — appointment booking and customer support route through WhatsApp deep links rather than an in-app messaging system.
- **Owner-operated** — a single non-technical owner manages the whole catalog and all orders through one dashboard, protected by one shared password.

The frontend is a polished, SEO- and AEO-optimized marketing + commerce site; the backend is a deliberately small, single-file Express API; and Supabase provides a managed Postgres database and public image storage.

---

## Key Features

**Storefront**
- Paginated product catalog with server-side filtering by **color/finish**, **placement** (ear/nose/belly/nipple), and **material collection** (Titanium, Surgical Steel, 18k Gold Plated).
- Product detail pages with **multi-image galleries**, **bar size**, **gem size (mm)**, and **color** variant selectors, each with **per-variant pricing and stock**.
- Cart with `localStorage` persistence, variant-aware line items, and toast confirmations.
- COD checkout with client-side validation, a **free-delivery threshold ($75)**, and order-confirmation emails.
- WhatsApp-based **appointment booking** with a custom date/time picker.
- SEO/AEO: per-page metadata, Open Graph/Twitter tags, canonical URLs, `sitemap.xml`, `robots.txt`, JSON-LD (`Organization`, `LocalBusiness`/`JewelryStore`, `Product`, `BreadcrumbList`, `FAQPage`), and an answer-engine-optimized `/faq` hub.

**Admin dashboard** (`/admin`)
- Inventory management: create/edit/delete products, multi-image upload (≤ 5), multi-select placements & collections, per-variant color/size/gem-size with price overrides and stock toggles.
- Order management: paginated list, expandable order details, status transitions.
- Analytics: revenue, average order value, status breakdown, and best-sellers (computed from order line items).

**Platform**
- Self-initializing/self-migrating database (schema and backfills run on server boot).
- Transactional email (owner notification + customer receipt) via Brevo.
- Rate limiting on abuse-prone endpoints and duplicate-order protection.

---

## Tech Stack

### Frontend (`fusion-piercings-frontend/`)
- **Next.js 14.2.5** (App Router) + **React 18** + **TypeScript 5**
- **Tailwind CSS 3.4** for styling; **custom UI components** (the dropdown menu is hand-built, shadcn-styled — no Radix/UI-library dependency)
- **date-fns** for the booking date/time picker
- **@next/third-parties** for Google Analytics
- **@cloudflare/next-on-pages** + **wrangler** (dev dependency) for Cloudflare Pages builds

### Backend (`fusion-piercings-backend/`)
- **Node.js + Express 5**
- **pg** (node-postgres) for PostgreSQL access
- **multer** (memory storage) for multipart image uploads
- **sharp** for server-side image compression (→ WebP, max 1200px, q80)
- **express-rate-limit** for abuse protection
- **Brevo** transactional email API (called via native `fetch`)

### Data & Infrastructure
- **Supabase PostgreSQL** — primary database
- **Supabase Storage** — public `jewelry-images` bucket for product images
- **Brevo** — transactional email
- **Google Analytics** — web analytics
- **Cloudflare Pages** (frontend) + **Render** (backend) for hosting

---

## System Architecture

```
                          ┌────────────────────────────┐
   Browser ───────────────►   Cloudflare Pages          │
                          │   Next.js 14 (App Router)    │
                          │   - SSG marketing pages      │
                          │   - Edge SSR /product/[id]   │
                          │   - Client islands (cart,    │
                          │     shop grid, admin, book)  │
                          └──────────────┬───────────────┘
                                         │  HTTPS  (NEXT_PUBLIC_API_URL)
                                         ▼
                          ┌────────────────────────────┐
                          │   Render (Node web service) │
                          │   Express 5 REST API         │
                          │   - Public + admin routes    │
                          │   - Rate limiting            │
                          │   - Image processing (sharp) │
                          │   - Email (Brevo)            │
                          └───────┬───────────────┬──────┘
                                  │               │
                       SQL (pg)   │               │  Storage SDK
                                  ▼               ▼
                       ┌──────────────────┐  ┌──────────────────┐
                       │ Supabase Postgres │  │ Supabase Storage  │
                       │ products, orders, │  │ jewelry-images    │
                       │ collections,      │  │ (public bucket)   │
                       │ contact_messages  │  └──────────────────┘
                       └──────────────────┘
                                  ▲
                                  │  (transactional email)
                          ┌───────┴───────┐
                          │   Brevo API    │
                          └───────────────┘
```

**Why this shape?**

- **Decoupled frontend/backend.** The Next.js app is a pure API client (`NEXT_PUBLIC_API_URL`) — it holds no database credentials. This lets the storefront deploy to an edge platform (Cloudflare) while the stateful API runs on a traditional Node host (Render) close to the database.
- **Rendering strategy is mixed by intent.** Marketing/legal pages are static (`SSG`); collection pages are static with a fixed slug set; the product page uses **Edge SSR** purely so `generateMetadata`/JSON-LD have real product data for crawlers, while the interactive product UI hydrates and re-fetches client-side. Cart, shop grid, admin, and booking are client islands.
- **Single-file backend.** `server.js` contains all routes plus `initDB()`. For a small owner-operated store this keeps operational complexity low; the trade-off is a large file (a known refactor target).
- **Self-migrating database.** `initDB()` runs on every boot and is fully idempotent (`CREATE TABLE IF NOT EXISTS`, guarded `ALTER`s, conditional backfills). There is no separate migration tool — schema evolution lives in code so a fresh Supabase project becomes production-ready on first start.

---

## Folder Structure

```
fusion-piercings-frontend/            ← repo root (monorepo)
│
├── fusion-piercings-frontend/        ← Next.js application
│   ├── app/                          ← App Router routes
│   │   ├── layout.tsx                ← root layout: fonts, CartProvider, GA, org/LocalBusiness JSON-LD
│   │   ├── page.tsx                  ← home (Hero, TrustBar, Shop, Footer)
│   │   ├── admin/page.tsx            ← password-gated dashboard (client)
│   │   ├── book/                     ← appointment booking (WhatsApp)
│   │   ├── care-guide/page.tsx       ← "coming soon" placeholder
│   │   ├── checkout/page.tsx         ← COD checkout
│   │   ├── collections/[slug]/       ← material-collection pages (SSG, dynamicParams=false)
│   │   ├── faq/                      ← FAQ hub (FAQPage JSON-LD)
│   │   ├── product/[id]/             ← product detail (Edge SSR + client island)
│   │   ├── privacy|terms|returns|shipping/  ← legal pages (data-driven)
│   │   ├── sitemap.ts | robots.ts | manifest.ts
│   │   └── error.tsx | global-error.tsx | not-found.tsx
│   │
│   ├── components/
│   │   ├── Nav, Hero, Shop, ProductCard, CartDrawer, Footer, TrustBar, Toast, WhatsAppWidget,
│   │   │   DateTimePicker, AdminProductModal, FaqAccordion
│   │   ├── admin/                    ← AdminOrderRow, AdminProductRow
│   │   ├── ui/                       ← custom dropdown-menu, Pagination
│   │   ├── seo/                      ← JsonLd renderer
│   │   └── legal/                    ← LegalPage shell + LegalSection
│   │
│   ├── context/CartContext.tsx       ← cart reducer + localStorage + toast
│   ├── lib/
│   │   ├── types.ts                  ← Product, Order, CartItem, variant types
│   │   ├── products.ts               ← color gradient/label maps
│   │   ├── business.ts               ← NAP, studio LOCATIONS, areaServed
│   │   ├── legal.ts                  ← legal-page copy variables
│   │   ├── seo.ts                    ← JSON-LD builders
│   │   ├── site.ts                   ← SITE_URL (canonical origin)
│   │   ├── pagination.ts             ← page-number helper + PageMeta type
│   │   └── useOnlineStatus.ts        ← offline detection hook
│   └── public/                       ← fonts, images (Hero-img.webp, logo)
│
└── fusion-piercings-backend/         ← Express API
    ├── server.js                     ← all routes + initDB() (schema + migrations)
    ├── seed-test-products.js         ← dev: seed sample products   (--clean to remove)
    ├── seed-test-orders.js [N]       ← dev: seed N test orders     (--remove / --count / --redate)
    └── seed-test-gold-plated.js      ← dev: seed gold-plated test products (--clean)
```

> **Note:** the GitHub remote is named `fusion-piercings-frontend`, but the repository contains **both** apps. On Cloudflare/Render the build "Root Directory" is set to the relevant subfolder.

---

## Database Design

PostgreSQL (Supabase). The schema is created and migrated by `initDB()` in `server.js` on every boot. There are **no foreign-key constraints** — relationships are intentionally soft (see rationale below).

### `products`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `SERIAL PK` | |
| `name` | `VARCHAR NOT NULL` | |
| `description` | `TEXT` | |
| `price` | `NUMERIC(10,2) NOT NULL` | base price |
| `image_url` | `TEXT` | primary thumbnail (first image) |
| `image_urls` | `TEXT[]` | full gallery (≤ 5) |
| `category` | `VARCHAR` | **legacy** single placement |
| `categories` | `TEXT[]` | current multi-placement (`ear`/`nose`/`belly`/`nipple`) |
| `color` | `VARCHAR` | **legacy/derived** single value (`gold`/`silver`/`both`) |
| `colors` | `JSONB` | current `[{ color, in_stock }]` |
| `sizes` | `JSONB` | bar sizes `[{ size, in_stock, price?, variants? }]` |
| `gem_sizes` | `JSONB` | gem sizes in mm `[{ gem_size, in_stock, price?, variants? }]` |
| `stock_count` | `INTEGER` | `999` = in stock, `0` = out of stock (a flag, not a quantity) |
| `material_tags` | `TEXT[]` | collection slugs this product belongs to |
| `created_at` | `TIMESTAMP` | |

### `orders`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `SERIAL PK` | order number shown to customers |
| `first_name`, `last_name`, `phone`, `city`, `address` | `VARCHAR NOT NULL` | delivery info |
| `email`, `building` | `VARCHAR` (nullable) | |
| `items` | `JSONB NOT NULL` | **denormalized** line-item snapshot |
| `subtotal`, `delivery_fee`, `total_amount` | `NUMERIC(10,2)` | |
| `status` | `VARCHAR` | `pending`/`confirmed`/`shipped`/`delivered`/`cancelled` |
| `idempotency_key` | `TEXT UNIQUE` | duplicate-order guard |
| `created_at` | `TIMESTAMP` | |

### `collections`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `SERIAL PK` | |
| `slug` | `VARCHAR UNIQUE` | `titanium`, `surgical-steel`, `gold-plated-hoops` |
| `name` | `VARCHAR` | display name |
| `sort_order` | `INTEGER` | nav ordering |

Seeded idempotently on boot.

### `contact_messages`
`id`, `name`, `email`, `phone?`, `message`, `created_at` — populated by `POST /api/contact`.

### Relationships & design rationale

- **Orders → line items are denormalized JSON.** Each order stores a snapshot of the items (name, price, qty, size, gemSize, color, image). This **captures price at time of purchase** and means an order is fully self-describing even if the product is later edited or deleted. The trade-off: you cannot SQL-aggregate "units sold per product" without parsing JSON, so the admin analytics computes best-sellers client-side from the orders payload.
- **Collections ↔ products is a soft, tag-based relationship.** A product belongs to a collection when the collection's `slug` appears in the product's `material_tags[]`. Collection pages query `WHERE $slug = ANY(material_tags)`. No join table, no FK.
- **Dual-write legacy + current columns.** `category`/`color` (single values) are kept in sync alongside `categories[]`/`colors` (JSONB). The storefront's color filter still queries the simple `color` column (`color = $1 OR color = 'both'`) for speed, while the admin reads/writes the richer arrays. `initDB()` backfills the new columns from the legacy ones for older rows. This is a backward-compatibility strategy for a schema that evolved from "one metal, one placement" to "multiple colors, placements, and variants" without a destructive migration.
- **No foreign keys.** With a single owner, a tiny dataset, and Supabase-managed Postgres, referential constraints add migration friction without meaningful benefit here. Integrity is enforced in application code.

---

## Authentication & Authorization

### Admin
- A **single shared password** stored in the backend env var `ADMIN_PASSWORD`.
- The admin UI submits it to `POST /api/admin/auth`, which does a plaintext comparison and returns `{ ok: true }` on match (rate-limited to 10 attempts / 5 min per IP).
- On success the **frontend** sets `sessionStorage.admin_auth = '1'` and renders the dashboard. The session lives only in the browser tab.

> ⚠️ **Important:** authentication only gates the **UI**. Issuing a token is *not* part of the flow, and the admin **data** endpoints (`/api/admin/*`, product `POST`/`PUT`/`DELETE`, `PATCH /products/:id/stock`) **do not verify any credential server-side.** Anyone who knows the API base URL can call them directly. This is the single most important item in [Known Limitations](#known-limitations--future-improvements) and [Security](#security-considerations).

### Customers
- **No accounts.** Checkout and booking are fully guest flows. The only customer data stored is what is submitted per order (`orders`) or per contact message (`contact_messages`).

---

## API Architecture & Integrations

Base URL: `${NEXT_PUBLIC_API_URL}` (e.g. `https://<service>.onrender.com/api`). All responses are JSON. SQL uses parameterized queries throughout.

### Public endpoints
| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/products` | Paginated catalog. Query: `page`, `limit` (≤ 100), `color`, `category`, `material_tag`. Returns `{ products, total, page, limit, totalPages, hasNextPage, hasPrevPage }`. |
| `GET` | `/api/products/:id` | Single product. |
| `GET` | `/api/collections` | Collection list (ordered). |
| `POST` | `/api/orders` | Place a COD order. **Rate-limited** (8 / 10 min). Idempotent. |
| `POST` | `/api/contact` | Store a contact message + email the owner. **Rate-limited** (5 / 10 min). |
| `POST` | `/api/admin/auth` | Validate the admin password. **Rate-limited** (10 / 5 min). |

### Admin endpoints (UI-gated only — see Auth note)
| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/admin/inventory` | Products split into `{ active, inactive }` by `stock_count`. |
| `GET` | `/api/admin/orders` | Paginated orders (`page`, `limit`). |
| `PATCH` | `/api/admin/orders/:id/status` | Update order status (validated against the allowed set). |
| `POST` | `/api/products` | Create product (multipart, ≤ 5 images). |
| `PUT` | `/api/products/:id` | Update product (multipart; merges kept + new images). |
| `DELETE` | `/api/products/:id` | Delete product **and** its Supabase Storage images. |
| `PATCH` | `/api/products/:id/stock` | Toggle stock state (`in_stock`/`out_of_stock`/`low_stock`). |

### Integrations
- **Supabase Postgres** via `pg` connection pool (`DATABASE_URL`, SSL, retrying boot).
- **Supabase Storage** via `@supabase/supabase-js` — uploads go to the public `jewelry-images` bucket; deletes remove the underlying files.
- **sharp** — every uploaded image is re-encoded to **WebP, ≤ 1200px wide, quality 80** before upload. This both shrinks payloads and strips any non-image payload from the original file.
- **Brevo** — transactional email via `https://api.brevo.com/v3/smtp/email` using native `fetch`. *(Rationale: Render's network blocks outbound SMTP, so the HTTP API is used instead of an SMTP client.)* Two emails per order: an owner notification and (if an email was provided) a customer receipt. **Emails are sent after the success response, in the background**, so email latency never delays order confirmation.

---

## Core User Flows & Business Logic

### Browsing & filtering
The shop grid is a client island that requests `/api/products` with `page`, `color`, `category`, and (on collection pages) `material_tag`. Filter UI state maps directly to query params, so **filtering and pagination happen server-side**. Collection pages (`/collections/titanium`, etc.) are statically generated for a fixed slug set and pre-scope to a `material_tag`.

### Product detail & variant pricing
The product page selects a **bar size**, **gem size (mm)**, and **color**. Availability and price are both resolved **per colour** — see [Per-colour stock & pricing](#per-colour-stock--pricing). Price resolves by precedence:

```
per-colour gem price > gem-size price > per-colour bar price > bar-size price > base price
```

The chosen variant + resolved price are passed to the cart.

### Per-colour stock & pricing

A product sold in both gold and silver rarely runs out of both at once. Each entry in `sizes` and `gem_sizes` therefore carries an optional `variants` map keyed by colour slug:

```json
{
  "size": "8mm",
  "in_stock": true,
  "price": null,
  "variants": {
    "gold":   { "in_stock": false, "price": null },
    "silver": { "in_stock": true,  "price": 52.5 }
  }
}
```

Availability is an **AND of two levels**: the entry's own `in_stock` is a master switch across every colour, and the per-colour override refines it. A colour with no entry in the map inherits the row's `in_stock` and `price`.

The map is **optional and omitted when empty**, so every product row written before this feature stays valid — no migration was required, and single-colour products never carry one. All parsing and resolution lives in `lib/variants.ts` (`isVariantInStock`, `variantPrice`, `resolvePrice`, `isProductSoldOut`), shared by the storefront and the admin modal so the two cannot drift.

On the storefront, sizes unavailable in the selected colour render struck through. Switching colour restrikes the list without moving the shopper's selection; if the selection is unavailable in the new colour, Add to Cart disables and the message names the colour.

### Cart
Cart state is a `useReducer` store in `CartContext`, persisted to `localStorage` under `fp_cart`. Each line item's identity is a composite key `id-size-color-gemSize`, so the same product in different variants are distinct lines. Adding shows a toast; the drawer does **not** auto-open (so customers can keep shopping).

### Checkout (COD)
The checkout collects name, phone, email (optional), city, address, building (optional). Delivery is **$3 flat, free at ≥ $75**. The client posts the cart plus computed `subtotal`/`deliveryFee`/`total`. The server:

1. Validates required fields and a non-empty cart.
2. **Duplicate protection** (three layers):
   - honors an `Idempotency-Key` request header (unique index + `ON CONFLICT DO NOTHING`);
   - a **content-window dedup** — same `phone` + `total` within **90 seconds** returns the existing order (catches double-submits across tabs even without a key);
   - the submit button is disabled while in-flight on the client.
3. Inserts the order, **responds instantly with the order id**, then sends the owner/customer emails in the background.

### Booking
`/book` collects name, phone, location (one of the three studios), piercing type, and a date/time, then opens a **WhatsApp deep link** (`wa.me/<number>?text=...`) pre-filled with the request. There is no backend call — confirmation happens over WhatsApp.

### Business rules summary
- **Currency:** USD only.
- **Payment:** COD only (no gateway).
- **Delivery:** $3 flat; free ≥ $75.
- **Stock:** `stock_count` is a manual on/off flag (`999`/`0`) plus per-variant `in_stock`; **stock is not decremented automatically when an order is placed.**
- **Color model:** canonical `gold`/`silver`/`both`; legacy `titanium` maps to the silver visual.

---

## Admin Dashboard

Reachable at `/admin`, behind the password gate. Three views:

- **Inventory** — toggles between Active and Inactive products. Create/edit/delete products via a modal supporting: name, description, base price, up to 5 images (drag-to-remove, "new" badges), multi-select placements, multi-select material collections, multiple colors (each with a stock toggle), bar sizes and gem sizes (each with an optional per-variant price and a stock toggle). When a product has **two or more colors**, each size row expands into a matrix of per-colour cells — one stock toggle and one price field per colour — so a size can be sold out in gold while still selling in silver. With a single colour the rows collapse back to a single toggle. Stock can also be toggled inline from the product row.
- **Orders** — paginated list; each row expands to show customer details, payment summary, line items (with variant labels and per-line totals), and a status selector (pending → confirmed → shipped → delivered / cancelled).
- **Analytics** — total orders, total revenue (excluding cancelled), average order value, pending/completed/cancelled counts, a status-breakdown bar, and a best-sellers table. Best-sellers are aggregated **client-side** from the orders' JSON line items.

---

## Security Considerations

**In place**
- **Parameterized SQL** everywhere (`pg` placeholders) — no SQL injection surface.
- **Rate limiting** on orders, admin auth (brute-force slowdown), and contact.
- **Duplicate-order protection** (idempotency key + 90-second content-window dedup + `ON CONFLICT`).
- **Upload hardening** — `multer` memory storage, max 5 files, and `sharp` re-encoding (re-encoding to WebP discards any non-image bytes in the original).
- **Secrets in environment variables**; the frontend bundle never sees DB or service credentials.
- **`trust proxy` + standard rate-limit headers** so the limiter sees real client IPs behind Render's proxy.

**Gaps / things to harden before scaling**
- 🔴 **Admin data endpoints are not authenticated server-side.** `/api/admin/*`, product `POST`/`PUT`/`DELETE`, and the stock `PATCH` accept any caller. Add a shared-secret/bearer-token middleware (validated against an env var) and send it from the admin UI. *Highest priority.*
- 🔴 **Order totals are trusted from the client.** The server stores the `subtotal`/`deliveryFee`/`total` it receives without recomputing them from the product table. COD (owner confirms each order by phone) mitigates the financial impact, but the server should recompute prices from the DB.
- 🟠 **CORS is fully open** (`app.use(cors())` with no allow-list). Restrict to the storefront origin(s).
- 🟠 **Admin password is compared in plaintext** against an env var. Fine for a single shared secret, but there is no hashing, no lockout beyond the rate limiter, and no per-user accounts.
- 🟠 **`ssl: { rejectUnauthorized: false }`** on the Postgres pool accepts the managed certificate without strict verification (common for Supabase poolers, but noted).

---

## Environment Variables

### Backend (`fusion-piercings-backend/.env`)
| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | Supabase Postgres connection string. |
| `SUPABASE_URL` | ✅ | Supabase project URL (Storage). |
| `SUPABASE_KEY` | ✅ | Supabase service/anon key used by the Storage client. |
| `ADMIN_PASSWORD` | ✅ | The admin dashboard password. |
| `BREVO_API_KEY` | ✅ (prod) | Brevo API key for transactional email. Without it, order/contact emails silently fail. |
| `EMAIL_USER` | ✅ | Sender address **and** the owner-notification recipient. |
| `PORT` | optional | API port (defaults to `5000`). |
| `EMAIL_PASS` | legacy | Left over from the previous SMTP/nodemailer approach; **unused** since the switch to the Brevo HTTP API. Safe to remove. |

### Frontend (`fusion-piercings-frontend/.env.local`)
| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ | Backend API base, e.g. `http://localhost:5000/api` (dev) or `https://<service>.onrender.com/api` (prod). |
| `NEXT_PUBLIC_SITE_URL` | ✅ (prod) | Canonical site origin used for canonical tags, Open Graph, JSON-LD, and the sitemap (e.g. `https://fusionpiercings.app`). Falls back to `http://localhost:3000` if unset — **must** be set in production or all SEO URLs point to localhost. |

> In production these are set in the **Cloudflare Pages** (frontend) and **Render** (backend) dashboards, not committed to the repo.

---

## Local Development Setup

**Prerequisites:** Node.js 18+ and a Supabase project (Postgres + a public `jewelry-images` Storage bucket). A Brevo account is only needed if you want emails to actually send.

### 1. Backend
```bash
cd fusion-piercings-backend
npm install
# create .env with the backend variables above
npm run dev          # nodemon → http://localhost:5000
```
On first boot, `initDB()` creates all tables, seeds the collections, and runs backfills. Watch for `Database ready` in the logs.

### 2. Frontend
```bash
cd fusion-piercings-frontend
npm install
# create .env.local:
#   NEXT_PUBLIC_API_URL=http://localhost:5000/api
#   NEXT_PUBLIC_SITE_URL=http://localhost:3000
npm run dev          # → http://localhost:3000
```

### 3. (Optional) Seed sample data
From `fusion-piercings-backend/` (these talk directly to the DB, bypassing the API/rate limits):
```bash
node seed-test-products.js          # sample products   | --clean to remove
node seed-test-orders.js 20         # 20 test orders    | --remove / --count / --redate
node seed-test-gold-plated.js       # gold-plated set   | --clean to remove
```

---

## Build & Deployment

### Frontend → Cloudflare Pages
- **Build command:** `npx @cloudflare/next-on-pages`
- **Build output directory:** `.vercel/output/static`
- **Root directory:** `fusion-piercings-frontend`
- **Compatibility flag:** `nodejs_compat` **must** be enabled for **both** Production and Preview (Settings → Runtime). Without it the deployed site throws a Node.js Compatibility Error at request time.
- **Environment variables:** set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SITE_URL` in the Pages dashboard.
- **Rendering constraints (required by `next-on-pages`):**
  - `app/product/[id]/page.tsx` exports `runtime = 'edge'` (it is server-rendered on demand).
  - `app/collections/[slug]/page.tsx` exports `dynamicParams = false` so it is fully static SSG.
- **Deploys** automatically on `git push` to the connected branch (Cloudflare builds in the cloud on Linux).

> ⚠️ **Do not add a `wrangler.toml` to the Pages project.** On Cloudflare Pages, the presence of a `wrangler.toml` causes the dashboard configuration — **including environment variables** — to be ignored, which breaks the storefront's API connection. Use dashboard configuration only.

> ℹ️ The `next-on-pages` build runs reliably only on Linux/macOS/WSL — **not native Windows** (the Vercel CLI it wraps fails to spawn). On Windows, deploy via `git push` (cloud build) rather than a local CLI build.

### Backend → Render
- **Type:** Web Service (Node).
- **Root directory:** `fusion-piercings-backend`
- **Build command:** `npm install`
- **Start command:** `npm start` (`node server.js`)
- **Environment variables:** all backend variables above, set in the Render dashboard.
- The app calls `app.set('trust proxy', 1)` for correct client-IP handling behind Render's proxy, and retries DB initialization up to 5× on boot (useful if the Supabase project is waking from pause).

### Database & storage → Supabase
- PostgreSQL is migrated automatically by `initDB()` on backend boot — no manual SQL needed.
- Create a **public** Storage bucket named `jewelry-images`.

---

## Known Limitations & Future Improvements

| Area | Limitation | Suggested improvement |
|------|------------|-----------------------|
| **Security** | Admin data endpoints have no server-side auth. | Add token/shared-secret middleware on `/api/admin/*` and product mutations. |
| **Security** | Order totals are trusted from the client. | Recompute `subtotal`/`delivery`/`total` server-side from the product table. |
| **Security** | CORS is fully open. | Restrict to the storefront origin(s). |
| **Inventory** | Stock is a manual flag; orders don't decrement it. | Optional per-variant quantity tracking with atomic decrement at checkout. |
| **Scale** | Admin analytics/best-sellers aggregate all fetched orders client-side. | Move aggregation to SQL endpoints once order volume grows (hundreds+). |
| **Accounts** | No customer accounts or order history. | Add optional auth + a customer order-lookup. |
| **Images** | Next.js image optimization does not run on Cloudflare Pages; images serve at source size (the hero is pre-compressed to WebP). | Enable Cloudflare Image Transformations (+ a custom loader) to auto-resize remote product images. |
| **Contact** | `POST /api/contact` exists but no frontend form is wired to it (support is WhatsApp-first). | Add a contact form or remove the endpoint. |
| **Content** | `/care-guide` is a "coming soon" placeholder. | Replace with the studio's real care content. |
| **Code health** | `server.js`, `AdminProductModal`, and `ProductDetailClient` are large; some variant-coercion logic is duplicated across the product page and admin modal. | Incremental extraction once test coverage exists. |
| **Config** | `EMAIL_PASS` is a dead env var. | Remove. |

---

## Troubleshooting

**Deployed site shows "Node.JS Compatibility Error"**
Add the `nodejs_compat` compatibility flag to **both** Production and Preview in the Cloudflare Pages → Settings → Runtime, then redeploy. Flags only apply to new deployments.

**Products don't load and/or admin won't log in on the live site**
All API calls are failing. Check, in order: (1) `NEXT_PUBLIC_API_URL` is set correctly in the Cloudflare Pages dashboard; (2) **no `wrangler.toml` exists** in the project (it silently overrides dashboard env vars — remove it and redeploy); (3) the Render backend isn't asleep/cold-starting (free tier sleeps after inactivity). Confirm with DevTools → Network: inspect the failing request's URL.

**Cloudflare build fails: "routes were not configured to run with the Edge Runtime"**
A dynamic (`[param]`) route is server-rendered without `export const runtime = 'edge'`. Add it (or make the route fully static with `generateStaticParams` + `dynamicParams = false`).

**Order emails aren't arriving**
Ensure `BREVO_API_KEY` and `EMAIL_USER` are set in the **backend** (Render) env and that the backend has been redeployed. Emails send in the background, so the order still succeeds even when email fails — check the backend logs for `Brevo API Error`.

**Backend exits on boot / "Could not connect to database"**
The Supabase project is likely paused or unreachable. `initDB()` retries 5× then exits; resume the Supabase project and restart the service.

**Product images are missing or the page is heavy**
Next.js image optimization is inactive on Cloudflare, so images serve at their stored size. Ensure uploads went through the API (so `sharp` compressed them) and consider Cloudflare Image Transformations for on-the-fly resizing.

**`npx @cloudflare/next-on-pages` fails locally on Windows**
Expected — the underlying Vercel CLI doesn't run on native Windows. Build inside **WSL** or simply rely on the Cloudflare cloud build triggered by `git push`.

**Duplicate orders**
The API dedupes by `Idempotency-Key` header and by `phone + total` within a 90-second window. If a legitimate repeat order is being blocked, it's within that window — wait 90 seconds or send a distinct `Idempotency-Key`.

---

*This documentation is derived from the actual implementation in `fusion-piercings-frontend/` and `fusion-piercings-backend/`. When you change schema, routes, env vars, or deployment configuration, update this file alongside the code.*
