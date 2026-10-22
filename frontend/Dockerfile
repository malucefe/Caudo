# ---- build ----
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund
COPY . .
# Configuración "docker": apunta a la API publicada en localhost:3000
RUN npx ng build --configuration docker

# ---- runtime (SSR) ----
FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/dist/CaudoFront ./dist/CaudoFront
COPY --from=build /app/package*.json ./
RUN npm install --omit=dev --no-audit --no-fund
USER node
EXPOSE 4000
CMD ["node", "dist/CaudoFront/server/server.mjs"]
