# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    libvips \
    && rm -rf /var/lib/apt/lists/*

# ── Dependencies ──────────────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --prefer-offline --no-audit --fund=false

# ── Builder ───────────────────────────────────────────────────────────
FROM base AS builder

# Bound the webpack heap. Payload admin bundling is the memory bottleneck, but
# this build shares an 8GB host with other running apps — an unbounded/oversized
# heap lets Node balloon until the host swaps and every other service stalls.
#
# Measured peak RSS for a cold `next build` of this app:
#   --max-old-space-size=4096 -> 2.70 GB (90s)
#   --max-old-space-size=2048 -> 2.14 GB (84s)
#   --max-old-space-size=1536 -> 1.81 GB (94s)
# The build only needs ~1.8GB; a 4GB ceiling just lets V8 defer GC and carry
# ~900MB of garbage, which is what pushed the shared host into swap. 2048 keeps
# a margin above the 1.81GB floor at no measurable time cost.
ENV NODE_OPTIONS="--max-old-space-size=2048"
ENV NODE_ENV=production

# NEXT_PUBLIC_* values are inlined into the client bundle at build time, so they
# must arrive as build args — setting them only as runtime env has no effect.
# Changing any of these requires a rebuild, not just a restart.
ARG NEXT_PUBLIC_APP_URL=""
ARG NEXT_PUBLIC_STORE_CURRENCY="DZD"
ARG NEXT_PUBLIC_META_PIXEL_ID=""
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_STORE_CURRENCY=$NEXT_PUBLIC_STORE_CURRENCY \
    NEXT_PUBLIC_META_PIXEL_ID=$NEXT_PUBLIC_META_PIXEL_ID

# 1. Copy dependencies first (cached layer)
COPY --from=deps /app/node_modules ./node_modules

# 2. Copy config/metadata files first (changes rarely → stays cached)
COPY package.json tsconfig.json next.config.ts postcss.config.mjs ./
COPY components.json ./

# 3. Copy source directories
COPY app ./app
COPY components ./components
COPY collections ./collections
COPY lib ./lib
COPY hooks ./hooks
COPY stores ./stores
COPY public ./public

# 4. Copy root-level source files
COPY payload.config.ts middleware.ts ./

# 5. Build with:
#    - Persistent .next/cache so webpack reuses compiled chunks across builds
#    - --no-lint to skip ESLint (already validated before Docker build)
RUN --mount=type=cache,target=/app/.next/cache \
    npx next build --no-lint

# ── Runner ────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apt-get update && apt-get install -y --no-install-recommends \
    libvips \
    && rm -rf /var/lib/apt/lists/*

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Create the media dir and symlink AFTER all COPY commands so the symlink is not
# overwritten by the public-dir copy layer.
#
# `.next/cache` is created here too, and this is load-bearing. It holds the
# image optimizer's output, and it is NOT part of the build output we copy in,
# so the container starts with it absent and every optimized variant is
# re-encoded from a 3000x2000 source after each deploy (~0.75s each, measured).
# The fix is a Dokploy volume mounted at /app/.next/cache — but Docker creates a
# missing mountpoint owned by root, and the server runs as `nextjs`, which would
# leave the optimizer unable to write and silently fall back to re-encoding on
# every single request. Creating it with the right owner first means the volume
# inherits that ownership instead.
RUN mkdir -p /app/media /app/.next/cache \
    && chown -R nextjs:nodejs /app/media /app/.next

USER nextjs

EXPOSE 3000

# Swarm/Dokploy rolling updates use this to decide when the new task is live,
# so a broken deploy never replaces a healthy container.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]