# ─── Stage 1: Build ────────────────────────────
FROM node:20-alpine AS builder

# No se requieren dependencias de compilación nativa para bcryptjs

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# bcryptjs es puro JS, no requiere rebuild nativo
RUN npm run build

# ─── Stage 2: Production ───────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Crear un usuario no root para seguridad
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copiar solo lo necesario desde el builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Asegurar permisos correctos
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 4000

CMD ["node", "dist/server.js"]
