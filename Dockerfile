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

WORKDIR /app

COPY . .

RUN pnpm dlx turbo prune --docker '@repo/api' '@repo/web'


# ----------------------------------------
# Install + Build
# ----------------------------------------
FROM base AS builder

WORKDIR /app

COPY --from=pruner /app/out/json/ ./

RUN pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ ./

ARG VITE_PUBLIC_KEY
ARG VITE_SERVER_URL
ARG VITE_BUCKET_URL
ARG VITE_PEER_HOST
ARG VITE_PEER_PORT
ARG VITE_PEER_PATH

ENV VITE_PUBLIC_KEY=${VITE_PUBLIC_KEY} \
    VITE_SERVER_URL=${VITE_SERVER_URL} \
    VITE_BUCKET_URL=${VITE_BUCKET_URL} \
    VITE_PEER_HOST=${VITE_PEER_HOST} \
    VITE_PEER_PORT=${VITE_PEER_PORT} \
    VITE_PEER_PATH=${VITE_PEER_PATH}

RUN pnpm run build


# ----------------------------------------
# Production Dependencies
# ----------------------------------------
RUN pnpm --filter '@repo/api' deploy --prod ./prod


# ----------------------------------------
# Runtime Environment
# ----------------------------------------
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production \
    LOG_LEVEL=info

COPY --from=builder /app/prod/ ./
COPY --from=builder /app/apps/web/dist/ ./public/dist/

RUN chown -R node:node /app/public
USER node

EXPOSE 4000

CMD ["node", "dist/index.js"]
