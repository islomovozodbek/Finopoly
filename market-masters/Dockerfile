FROM node:22-bookworm-slim AS frontend
WORKDIR /app/market-masters/client
COPY client/package*.json ./
RUN npm ci --no-audit --no-fund
COPY client/ ./
RUN npm run build

FROM node:22-bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app/market-masters
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY server/ ./server/
COPY --from=frontend /app/market-masters/client/dist/ ./client/dist/
ENV NODE_ENV=production PORT=3001
EXPOSE 3001
CMD ["node", "server/index.js"]
