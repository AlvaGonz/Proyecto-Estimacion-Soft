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
