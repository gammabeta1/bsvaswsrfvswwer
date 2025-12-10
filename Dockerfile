FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Remove possibly corrupted lockfile and reinstall cleanly
RUN rm -f package-lock.json && \
    npm install --omit=dev && \
    npm cache clean --force

COPY . .

# your CMD/ENTRYPOINT
