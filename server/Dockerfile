FROM node:20-alpine

# Instalar dependencias para compilar bcrypt
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
# Recompilar bcrypt para el contenedor Linux
RUN npm rebuild bcrypt --build-from-source
RUN npm run build

EXPOSE 4000

CMD ["node", "dist/server.js"]
