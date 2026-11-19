# syntax=docker/dockerfile:1

# ---- Base Stage ----
FROM node:24.22-alpine AS base

RUN corepack enable

WORKDIR /app

# ---- Pruner Stage ----
FROM base AS pruner

COPY . .

RUN pnpm dlx turbo@2.11.13 prune --docker @repo/peer

# ---- Builder Stage ----
FROM base AS builder

COPY --from=pruner /app/out/json/ ./

RUN pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ ./

RUN pnpm run build

RUN pnpm --filter @repo/peer deploy --prod ./prod

# ---- Runtime Stage ----
FROM base AS runtime

ENV NODE_ENV=production \
    LOG_LEVEL=info

COPY --from=builder /app/prod/ ./

RUN chown -R node:node /app/public
USER node

EXPOSE 5000

CMD ["node", "dist/index.js"]
