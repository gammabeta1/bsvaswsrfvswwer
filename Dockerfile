FROM node:20-alpine

WORKDIR /app

# Copy only the lockfile + package.json first (best practice)
COPY package*.json ./

# Use npm ci → reproducible, fast, and uses almost no extra disk because it reuses cache layers
RUN npm ci --omit=dev

# Optional but recommended: clean the cache is huge and useless in production image
RUN npm cache clean --force

# Now copy the rest of the code
COPY . .

# Your start command
CMD ["node", "server.js"]   # or "npm start", etc.
