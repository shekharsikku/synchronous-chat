# ---------- Builder ----------
FROM node:24.19-alpine AS builder

WORKDIR /app

COPY apps/api/package.json ./api/
RUN npm install --prefix api

COPY apps/web/package.json ./web/
RUN npm install --prefix web

COPY apps/api/ ./api/
RUN npm run build --prefix api

ARG VITE_PUBLIC_KEY
ARG VITE_SERVER_URL
ARG VITE_BUCKET_URL
ARG VITE_PEER_HOST
ARG VITE_PEER_PORT
ARG VITE_PEER_PATH

ENV VITE_PUBLIC_KEY=$VITE_PUBLIC_KEY
ENV VITE_SERVER_URL=$VITE_SERVER_URL
ENV VITE_BUCKET_URL=$VITE_BUCKET_URL
ENV VITE_PEER_HOST=$VITE_PEER_HOST
ENV VITE_PEER_PORT=$VITE_PEER_PORT
ENV VITE_PEER_PATH=$VITE_PEER_PATH

COPY apps/web/ ./web/
RUN npm run build --prefix web

# ---------- Runtime ----------
FROM node:24.19-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV LOG_LEVEL=info

COPY --from=builder /app/api/package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/api/dist ./dist
COPY --from=builder /app/api/public ./public
COPY --from=builder /app/web/dist ./public/dist

RUN chown -R node:node /app/public
USER node

EXPOSE 4000

CMD ["node", "dist/index.js"]
