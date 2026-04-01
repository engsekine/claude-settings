# Base image (using Node.js and Alpine Linux)
FROM node:22-alpine AS base

# Dependency installation
FROM base AS deps
RUN apk add --no-cache libc6-compat

USER node
WORKDIR /app
COPY --chown=node:node ./package.json ./
COPY --chown=node:node ./package-lock.json ./

RUN npm install --frozen-lockfile

# Build stage
FROM base AS build

WORKDIR /app

COPY --chown=node:node . ./

# Copy only dependencies to maximize cache usage
COPY --from=deps /app/node_modules ./node_modules

RUN npm run build

# Runtime environment
FROM node:22-alpine AS release

# Copy only the necessary dependencies
WORKDIR /app
COPY --from=build /app/.next ./.next
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules

USER node

HEALTHCHECK --interval=30s --timeout=10s \
  CMD curl -f ${HEALTHCHECK_URL} || exit 1

CMD ["npm", "start"]