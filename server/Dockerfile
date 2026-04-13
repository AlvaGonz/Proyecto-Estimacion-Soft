# server/Dockerfile for Backend (Node/Express)
FROM node:20-alpine

# No build tools needed for bcryptjs!
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install packages
RUN npm install

# Copy the rest of the source
COPY . .

# entrypoint.sh provides local environment initialization
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 4000

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["npm", "run", "dev"]
