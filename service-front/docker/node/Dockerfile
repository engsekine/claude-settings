# Base image (using Node.js and Alpine Linux)
FROM node:22-alpine AS base

# Install curl for healthcheck
RUN apk add --no-cache curl

# ========================================
# Dependency installation
# workspace 構造を再現してから npm ci を実行
# ========================================
FROM base AS deps
RUN apk add --no-cache libc6-compat

WORKDIR /app

# BuildKit が自動で提供するターゲットアーキテクチャ（amd64 / arm64）
ARG TARGETARCH

# 先に package.json 群だけコピー（変更頻度が低いため npm ci のキャッシュが効きやすい）
COPY package.json package-lock.json ./
COPY service-front/package.json ./service-front/
COPY packages/supabase/package.json ./packages/supabase/

# npm の optional dependencies バグ（https://github.com/npm/cli/issues/4828）の対処:
# Mac (darwin-arm64) で生成した package-lock.json には Linux 向けプラットフォーム固有
# バイナリ（lightningcss-linux-*-musl, @next/swc-linux-*-musl 等）が記録されないため、
# Alpine コンテナで npm ci しても native bin が入らず実行時にロード失敗する。
# 対象アーキテクチャ向けの musl バイナリを明示的に追加インストールしてこれを補う。
RUN npm ci && \
    cd service-front && \
    if [ "$TARGETARCH" = "arm64" ]; then \
        npm install --no-save --ignore-scripts \
            lightningcss-linux-arm64-musl \
            @next/swc-linux-arm64-musl \
            @tailwindcss/oxide-linux-arm64-musl; \
    else \
        npm install --no-save --ignore-scripts \
            lightningcss-linux-x64-musl \
            @next/swc-linux-x64-musl \
            @tailwindcss/oxide-linux-x64-musl; \
    fi

# ========================================
# Build stage
# ========================================
FROM base AS build

WORKDIR /app

# 依存をコピー
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/service-front/node_modules ./service-front/node_modules

# ソース全体をコピー
COPY . ./

# service-front を作業ディレクトリにして build
WORKDIR /app/service-front
RUN npm run build

# ========================================
# Development environment
# ========================================
FROM base AS development

ENV NODE_ENV=development

WORKDIR /app

# 依存をコピー
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/service-front/node_modules ./service-front/node_modules

# workspace 構造を再現
COPY package.json package-lock.json ./
COPY service-front/package.json ./service-front/
COPY packages/supabase ./packages/supabase

# .next ディレクトリを作成し権限を node ユーザーに付与
RUN mkdir -p service-front/.next && chown -R node:node /app

USER node

WORKDIR /app/service-front

EXPOSE 3000

CMD ["npm", "run", "dev"]

# ========================================
# Runtime environment (production)
# ========================================
FROM base AS release

ENV NODE_ENV=production

WORKDIR /app

# 本番依存のみインストール（workspace 構造を再現してから）
COPY package.json package-lock.json ./
COPY service-front/package.json ./service-front/
COPY packages/supabase ./packages/supabase
RUN npm ci --omit=dev --workspace=service-front --include-workspace-root

# ビルド成果物をコピー
COPY --from=build /app/service-front/.next ./service-front/.next
COPY --from=build /app/service-front/public ./service-front/public

USER node

WORKDIR /app/service-front

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["npm", "start"]
