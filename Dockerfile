FROM node:20-alpine

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev && npm cache clean --force

# Copy the rest of the app
COPY . .

EXPOSE 3000

CMD ["node", "index.js"]
