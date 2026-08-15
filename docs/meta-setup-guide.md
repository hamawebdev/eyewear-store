# Meta (Facebook/Instagram) Integration — Setup Guide

This guide walks a developer through obtaining the credentials the storefront needs
and configuring Meta Business for **effective** ad optimization. The code is already
implemented and **dormant**: with the four env vars empty, no Pixel script loads and
no Conversions API (CAPI) calls are made. Filling in the vars activates everything.

## What the code already does

| Event | Browser Pixel | Server CAPI | Notes |
|---|---|---|---|
| `PageView` | ✅ (incl. SPA route changes) | — | base snippet + `MetaPageView` |
| `ViewContent` | ✅ product page | — | |
| `AddToCart` | ✅ card + product page | — | |
| `InitiateCheckout` | ✅ checkout mount | — | value = cart subtotal |
| `Purchase` | ✅ on order success | ✅ from `/api/orders` | **deduplicated** via `event_id = orderRef` |

- **Currency:** `DZD`, taken from `NEXT_PUBLIC_STORE_CURRENCY`. `value` is the major‑unit amount (e.g. `1800`, not `180000`).
- **Deduplication:** browser and server `Purchase` share the order ref (`GS-XXXXXXXX`) as `event_id`, so Meta counts the conversion once.
- **PII matching:** the server event SHA‑256‑hashes name, phone (normalized to Algeria `213…`), city/state, and sends `client_ip_address`, `client_user_agent`, and the `_fbp`/`_fbc` cookies to maximize match quality.
- **Resilience:** a CAPI failure is logged and swallowed — it can never fail a customer's order.

## The four environment variables

```bash
# Browser Pixel id (public). Safe to expose to the client.
NEXT_PUBLIC_META_PIXEL_ID=

# Conversions API access token (SECRET — server only, never NEXT_PUBLIC).
META_CAPI_ACCESS_TOKEN=

# CAPI dataset/pixel id. Leave empty to reuse NEXT_PUBLIC_META_PIXEL_ID (the usual case).
META_CAPI_PIXEL_ID=

# Optional. A Test Events code for validating server events without polluting live data.
# Leave EMPTY in production.
META_CAPI_TEST_EVENT_CODE=
```

`NEXT_PUBLIC_META_PIXEL_ID` is read in the browser, so a **rebuild/redeploy** is required after changing it (Next.js inlines `NEXT_PUBLIC_*` at build time). `META_CAPI_ACCESS_TOKEN` is read at request time on the server.

---

## Prerequisites

- A personal Facebook account with admin rights to (or able to create) the brand's Business Portfolio.
- Admin/DNS access to **areedjdz.com** (for domain verification).
- The brand's Facebook Page and, ideally, the Instagram professional account.

---

## Step 1 — Business Manager (Business Portfolio)

1. Go to <https://business.facebook.com> → **Settings** (gear) or directly <https://business.facebook.com/settings>.
2. If the brand has no portfolio: **Create a portfolio** → enter business name (e.g. *Arridj / Areedj*), your name, and business email. Confirm via the email link.
3. Under **Accounts → Pages**, add or claim the Arridj Facebook Page.
4. Under **Accounts → Instagram accounts**, connect the Instagram professional account (optional but recommended for Instagram ad placements).
5. Under **Users → People**, make sure at least two people have **admin** access (avoids lockout if one loses access).

> Why: the Pixel/dataset, the CAPI token, domain verification, and the ad account must all live in the **same** Business Portfolio, or events and verification won't apply to your ads.

---

## Step 2 — Create the Pixel / Dataset → `NEXT_PUBLIC_META_PIXEL_ID`

Meta now calls the Pixel a **Dataset** inside **Events Manager**.

1. Open **Events Manager**: <https://business.facebook.com/events_manager2>.
2. **Connect data sources** → **Web** → **Get started**.
3. Choose a name (e.g. *Arridj Web*). This creates a dataset with a numeric id.
4. When asked for an installation method, **skip the on‑page installer** — the Pixel base code is already in the app ([components/meta/MetaPixel.tsx](../components/meta/MetaPixel.tsx)). You only need the **id**.
5. Copy the **Dataset/Pixel ID** (a ~15‑digit number).

```bash
NEXT_PUBLIC_META_PIXEL_ID=123456789012345
```

Leave `META_CAPI_PIXEL_ID` empty — the code falls back to this same id for CAPI.

---

## Step 3 — Conversions API access token → `META_CAPI_ACCESS_TOKEN`

1. In **Events Manager**, select the dataset from Step 2.
2. **Settings** tab → scroll to **Conversions API** → **Set up manually** / **Generate access token**.
   - If you don't see "Generate access token," expand **Conversions API** and look under **Manual setup**.
3. Copy the generated token. It is a long string and is shown **once** — store it in your secret manager immediately.

```bash
META_CAPI_ACCESS_TOKEN=EAAG...<long token>...
```

> This token is a **server secret**. Never commit it, never prefix it with `NEXT_PUBLIC_`, never expose it to the browser. Put it in your deployment's secret store (the app reads it via `process.env` at request time on the server only).

**Token longevity:** the dataset‑level token generated this way is a long‑lived system token tied to the dataset and does not expire on a fixed schedule, but it **will break if the generating user loses access** to the Business Portfolio. For production hardening, create a dedicated **System User** (Business Settings → Users → System users → add **Admin** system user → assign the dataset asset → **Generate token** with `ads_management`) and use *that* token instead. Same env var, more durable.

---

## Step 4 — Test Events code → `META_CAPI_TEST_EVENT_CODE` (temporary)

Use this only while validating, then remove it.

1. Events Manager → dataset → **Test events** tab.
2. Copy the **Test event code** shown (looks like `TEST12345`).
3. Set it in your **local/staging** env, place a test order, and watch events appear live in this tab.

```bash
# staging/local ONLY — remove before/for production
META_CAPI_TEST_EVENT_CODE=TEST12345
```

When set, the server CAPI calls include this code so events route to **Test events** instead of live metrics. **Leave it empty in production**, or your real conversions land in the test bucket.

---

## Step 5 — Domain verification (required for effective optimization)

Verifying **areedjdz.com** lets you configure event priority for iOS (Step 6) and prevents other accounts from claiming your domain's events.

1. **Business Settings** → **Brand safety → Domains** (<https://business.facebook.com/settings/owned-domains>).
2. **Add** → enter `areedjdz.com` (the root domain, no `https://`, no `www`).
3. Choose a verification method:
   - **DNS TXT record (recommended):** add the provided `TXT` record to the DNS for `areedjdz.com`, then click **Verify**. Propagation can take minutes to hours.
   - **Meta‑tag / HTML file:** alternatives if you'd rather not touch DNS. The meta‑tag method requires adding a `<meta name="facebook-domain-verification" ...>` tag to the site `<head>` — if you choose this, tell the team and it can be added to [app/layout.tsx](../app/layout.tsx).
4. Confirm the domain shows **Verified**.

---

## Step 6 — Aggregated Event Measurement (iOS / event priority)

Since iOS 14.5, Meta limits each verified domain to **8 prioritized web events**. Configuring them tells Meta which events matter most when a user has opted out of tracking — critical for a store whose ads depend on the Purchase signal.

1. Events Manager → **Aggregated Event Measurement** (or **Settings → Aggregated event measurement**).
2. Select the verified domain `areedjdz.com`.
3. **Edit / Configure web events** and rank, highest priority first:
   1. `Purchase`
   2. `InitiateCheckout`
   3. `AddToCart`
   4. `ViewContent`
   5. `PageView`
4. Save. Allowing ~24–72h for the configuration to take full effect is normal.

> The store's primary optimization goal is **Purchase**, so it must sit at rank 1. The remaining events feed retargeting and upper‑funnel optimization.

---

## Step 7 — Link the ad account

So that these events are usable as conversion goals in campaigns:

1. **Business Settings → Accounts → Ad accounts** — add or create the ad account, in the **same portfolio**.
2. **Data sources → Datasets** — confirm the Arridj dataset is **assigned** to that ad account.
3. When building a campaign with the **Sales** objective, pick the dataset and choose **Purchase** as the conversion event.

---

## Step 8 — Configure the app and deploy

1. Put the values in the server environment (secret store for the token):

   ```bash
   NEXT_PUBLIC_META_PIXEL_ID=123456789012345
   META_CAPI_ACCESS_TOKEN=EAAG...        # secret
   META_CAPI_PIXEL_ID=                   # empty → reuses the pixel id
   META_CAPI_TEST_EVENT_CODE=            # empty in production
   ```

2. **Rebuild and redeploy** (required because `NEXT_PUBLIC_META_PIXEL_ID` is inlined at build time).
3. The integration is now live.

See [.env.example](../.env.example) for the canonical list and inline notes.

---

## Step 9 — Verify end to end

**Browser (Pixel):**
1. Install the **Meta Pixel Helper** Chrome extension.
2. Browse: home → product → Add to cart → checkout → place an order.
3. Confirm the helper shows `PageView`, `ViewContent`, `AddToCart`, `InitiateCheckout`, `Purchase` with correct `value` / `currency` (DZD) / `content_ids`.
4. Click between pages and confirm a `PageView` fires per SPA navigation — and that the **first** load isn't double‑counted.

**Server (CAPI) + deduplication:**
1. With `META_CAPI_TEST_EVENT_CODE` set on staging, place an order.
2. Events Manager → **Test events** → confirm the **server** `Purchase` arrives.
3. Confirm the browser + server `Purchase` are flagged **Deduplicated** (same `event_id` = the order ref `GS-XXXXXXXX`).

**Resilience:**
1. Temporarily set an **invalid** `META_CAPI_ACCESS_TOKEN` on staging and place an order.
2. Confirm the order still completes (201, written to Google Sheets) and only a `[meta-capi]` error is logged.

**Match quality (after a few days of live traffic):**
- Events Manager → dataset → **Settings** / **Overview** → check the **Event Match Quality** for `Purchase` (aim for "Good"+). The server event already sends hashed name/phone/city + IP/UA + `_fbp`/`_fbc` to support this.

---

## Quick reference

| Credential | Where to get it | Env var | Secret? |
|---|---|---|---|
| Pixel / Dataset ID | Events Manager → dataset | `NEXT_PUBLIC_META_PIXEL_ID` | No (public) |
| CAPI access token | Events Manager → dataset → Settings → Conversions API | `META_CAPI_ACCESS_TOKEN` | **Yes** |
| CAPI pixel id | Same as Pixel ID (usually) | `META_CAPI_PIXEL_ID` (optional) | No |
| Test event code | Events Manager → Test events | `META_CAPI_TEST_EVENT_CODE` (temp) | No |

## Troubleshooting

- **No events at all in the browser:** `NEXT_PUBLIC_META_PIXEL_ID` empty, or the app wasn't rebuilt after setting it. Check page source for `connect.facebook.net/en_US/fbevents.js`.
- **Browser events fine, no server events:** `META_CAPI_ACCESS_TOKEN` missing/invalid, or outbound HTTPS to `graph.facebook.com` is blocked. Check server logs for `[meta-capi]`.
- **Purchase counted twice:** the browser and server events aren't sharing the order ref as `event_id` — verify the order succeeded and returned an `orderRef` (the dedup key).
- **Real conversions missing from reports:** `META_CAPI_TEST_EVENT_CODE` is still set in production, routing live events to Test events. Clear it and redeploy.
- **AEM won't let you configure events:** the domain isn't verified yet (Step 5), or events haven't been received from that domain recently.
