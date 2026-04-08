# Base image (using Node.js and Alpine Linux)
FROM node:22-alpine AS base

# Install curl for healthcheck
RUN apk add --no-cache curl

# Dependency installation
FROM base AS deps
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies (use ci for production)
RUN npm ci

# Build stage
FROM base AS build

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . ./

# Build Next.js app
RUN npm run build

# Development environment
FROM base AS development

ENV NODE_ENV=development

WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./

# Create .next directory with correct permissions
RUN mkdir -p .next && chown -R node:node /app

# Switch to non-root user
USER node

EXPOSE 3000

CMD ["npm", "run", "dev"]

# Runtime environment (production)
FROM base AS release

ENV NODE_ENV=production

WORKDIR /app

# Copy only production dependencies
COPY --from=deps /app/package.json ./
COPY --from=deps /app/package-lock.json ./
RUN npm ci --omit=dev

# Copy built app
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public

# Switch to non-root user
USER node

# Expose port
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["npm", "start"]