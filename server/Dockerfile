<<<<<<< HEAD
# ─── Stage 1: Build ────────────────────────────
FROM node:20-alpine AS builder

# Instalar dependencias para compilar bcrypt (requerido en Alpine)
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# Recompilar bcrypt para la arquitectura destino
RUN npm rebuild bcrypt --build-from-source
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
=======
# server/Dockerfile for Backend (Node/Express)
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# entrypoint.sh provides local environment initialization
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh
EXPOSE 4000
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["npm", "run", "dev"]
>>>>>>> Dockers-Buid
