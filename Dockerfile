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
# 4GB is enough headroom for the admin bundle while leaving the host responsive.
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NODE_ENV=production

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
RUN mkdir -p /app/media \
    && chown nextjs:nodejs /app/media

USER nextjs

EXPOSE 3000

# Swarm/Dokploy rolling updates use this to decide when the new task is live,
# so a broken deploy never replaces a healthy container.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]