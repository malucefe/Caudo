# ---- build ----
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build && npm prune --omit=dev

# ---- runtime ----
FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package*.json ./
RUN mkdir -p /app/uploads && chown -R node:node /app
USER node
EXPOSE 3000
# Las migraciones se ejecutan al arrancar (migrationsRun en producción).
CMD ["node", "dist/main"]
