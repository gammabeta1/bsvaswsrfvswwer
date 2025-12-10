FROM node:20-alpine

WORKDIR /app

# Copy only package files first
COPY package*.json ./

# Install dependencies with minimal disk usage
RUN npm ci --omit=dev && npm cache clean --force

# Copy the rest of the code
COPY . .

EXPOSE 3000

CMD ["node", "index.js"]
