# Deployment (Dokploy)

The storefront runs on Dokploy at `https://vost.agency`, in project **eyewear**,
environment **production**.

| Piece    | Dokploy service | Notes |
| -------- | --------------- | ----- |
| App      | `web` (`eyewear-web-2uyvew`) | Docker build from this repo's `Dockerfile`, branch `main` |
| Database | `eyewear-db` (`eyewear-db-y9ducy`) | `postgres:17-alpine`, volume `eyewear-db-y9ducy-data` |
| Uploads  | volume `eyewear-web-media` → `/app/media` | Payload media; survives redeploys |

Source is the private GitHub repo `hamawebdev/eyewear-store`, connected through
the Dokploy GitHub App. Auto-deploy on push to `main` is enabled.

## How the app reaches the database

The app connects over Dokploy's internal Docker network using the database's
service name — it is **not** exposed to the internet:

```
DATABASE_URL=postgresql://eyewear:<password>@eyewear-db-y9ducy:5432/eyewear
```

## Resource limits

Both services are capped so a bad deploy cannot starve the other apps on the host:

| Service | Memory limit | Memory reservation | CPU limit |
| ------- | ------------ | ------------------ | --------- |
| `web`   | 1.5 GB       | 512 MB             | 1.5 cores |
| `eyewear-db` | 1 GB    | 256 MB             | 1 core    |

The Docker build also caps Node's heap (`--max-old-space-size=4096`). Payload's
admin bundle is the memory hog in this build; without a cap it can balloon until
the host swaps and every other service on the box stalls.

## Database schema — migrations, never push

`payload.config.ts` only enables Drizzle's schema push when
`PAYLOAD_ENABLE_DB_PUSH=true`. **Leave it `false` in production.** Schema changes
go through committed migrations in [`../migrations/`](../migrations/):

```bash
# 1. Create the migration from your local schema changes
npx payload migrate:create <name>

# 2. Commit it, then apply it to production before deploying the new code
DATABASE_URL="postgresql://eyewear:<password>@<host>:<port>/eyewear?sslmode=disable" \
PAYLOAD_SECRET="<production secret>" \
PAYLOAD_SEED_ADMIN_EMAIL="bootstrap@local" \
PAYLOAD_SEED_ADMIN_PASSWORD="<anything>" \
PAYLOAD_SKIP_ADMIN_SEED=true \
npx payload migrate
```

Applying migrations needs network access to the database. The database has **no
external port** in normal operation, so temporarily set one in Dokploy
(`eyewear-db` → Advanced → External Port), run the migration, then clear it again.

> Clearing the port in the UI only updates the config — the service keeps
> publishing the port until it is redeployed. Verify from off-host afterwards
> (`nc -vz <host> <port>`) rather than assuming it closed. Both `eyewear`
> databases were found publicly reachable on 2026-08-17 because this step was
> missed.

## Where the image is built

Images are built by GitHub Actions ([`../.github/workflows/build-and-push.yml`](../.github/workflows/build-and-push.yml))
and pushed to `ghcr.io/hamawebdev/eyewear-store`. Dokploy pulls the finished
image rather than building it.

This is deliberate. The Dokploy host runs ~9 apps plus several databases on 8GB.
A cold `next build` of this app peaks around 2.1GB, which pushed the host into
swap: builds that take ~90 seconds on a normal machine ran for 50+ minutes and
then failed, while slowing every other service on the box. Building off-host
removes that pressure entirely.

`NEXT_PUBLIC_*` values are inlined into the client bundle at build time, so they
are passed as **build args in the workflow**, not as Dokploy runtime env. Changing
one means a rebuild, not a restart.

## The domain

`herizioptic.com` (apex, canonical) and `www.herizioptic.com` both point at the
Dokploy host and are bound to app `web` on container port `3000` with Let's
Encrypt certificates. `www` 301-redirects to the apex via a Dokploy redirect.

DNS is managed at Hostinger (nameservers `pixel`/`byte.dns-parking.com`); the
apex `A` record holds the host IP and `www` is a CNAME to the apex.

## Health

The container has a `HEALTHCHECK` hitting `/api/health`. Swarm uses it during
rolling updates, so a container that fails to boot is not promoted over the
running one.

## Integrations currently disabled

Meta Pixel / Conversions API, Google Sheets order webhook, Yalidine and Yalitec
are all unset in production. Add the variables in Dokploy's Environment tab to
enable them; the Meta Pixel id additionally requires a redeploy (build-time).
