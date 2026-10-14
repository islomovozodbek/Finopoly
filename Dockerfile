FROM node:22-bookworm-slim AS frontend
WORKDIR /app/market-masters/client
COPY market-masters/client/package*.json ./
RUN npm ci --no-audit --no-fund
COPY market-masters/client/ ./
RUN npm run build

FROM node:22-bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY market-masters/package*.json ./market-masters/
RUN npm ci --prefix market-masters --omit=dev --no-audit --no-fund
COPY market-masters/server/ ./market-masters/server/
COPY --from=frontend /app/market-masters/client/dist/ ./market-masters/client/dist/
ENV NODE_ENV=production PORT=3001
EXPOSE 3001
CMD ["node", "market-masters/server/index.js"]
