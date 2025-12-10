# Use a smaller base image
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies with cache optimization
RUN npm ci --omit=dev --no-audit --no-fund --no-optional \
    && npm cache clean --force

# Copy source code
COPY . .

# Build (if applicable)
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
# Or copy your built files here

# Use JSON format for CMD (fixes the warning)
CMD ["node", "server.js"]
