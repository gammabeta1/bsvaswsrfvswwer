# Use official Node.js LTS image as base
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies first (better caching)
COPY package*.json ./
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Expose the port your app uses
EXPOSE 3000

# Command to run the app
CMD ["node", "index.js"]
