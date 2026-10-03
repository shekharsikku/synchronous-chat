# ----------------------------------------
# Base Image
# ----------------------------------------
FROM node:24.19-alpine AS base

RUN corepack enable

WORKDIR /app


# ----------------------------------------
# Prune Workspace
# ----------------------------------------
FROM base AS pruner

COPY . .

RUN pnpm dlx turbo prune --docker '@repo/peer'


# ----------------------------------------
# Install + Build
# ----------------------------------------
FROM base AS builder

COPY --from=pruner /app/out/json/ ./

RUN pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ ./

RUN pnpm run build


# ----------------------------------------
# Production Dependencies
# ----------------------------------------
RUN pnpm --filter '@repo/peer' deploy --prod ./prod


# ----------------------------------------
# Runtime Environment
# ----------------------------------------
FROM base AS runner

ENV NODE_ENV=production \
    LOG_LEVEL=info

COPY --from=builder /app/prod/ ./

RUN chown -R node:node /app/public
USER node

EXPOSE 5000

CMD ["node", "dist/index.js"]
