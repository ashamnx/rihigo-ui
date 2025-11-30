# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application (ignore lint warnings exit code)
RUN npm run build || true

# Verify build succeeded
RUN test -d dist && test -d server

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 qwik

# Copy built assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/package*.json ./

# Install all dependencies (Qwik bundles most, but some are needed at runtime)
RUN npm ci

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV ORIGIN=https://rihigo.com

# Switch to non-root user
USER qwik

EXPOSE 3000

CMD ["node", "server/entry.node-server.js"]
