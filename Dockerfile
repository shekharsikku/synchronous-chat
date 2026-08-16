# ---------- Build ----------
FROM node:24.19-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY client/package*.json ./client/
RUN npm ci --prefix client

COPY . .

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

RUN npm run build
RUN npm run build --prefix client

# ---------- Production ----------
FROM node:24.19-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV LOG_LEVEL=info

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
COPY --from=build /app/client/dist ./client/dist

RUN chown -R node:node /app/public
USER node

EXPOSE 4000

CMD ["npm", "start"]
