# syntax=docker/dockerfile:1
# Multi-stage build → slim standalone runtime. No database / Prisma.

FROM node:22-alpine AS base

# --- deps: install with frozen lockfile for reproducible builds ---
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# --- builder: produce the standalone server bundle ---
FROM base AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable pnpm && pnpm build

# --- runner: minimal, non-root ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Bridge networking default: listen on all interfaces inside the container.
# (For host-networking + WireGuard, override PORT=2000 HOSTNAME=127.0.0.1 — see docker-compose.yml.)
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Reuse the built-in non-root `node` user (uid/gid 1000).
COPY --from=builder /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node
EXPOSE 3000
CMD ["node", "server.js"]
