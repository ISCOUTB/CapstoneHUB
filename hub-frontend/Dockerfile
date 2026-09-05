# reference source: https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile
### Stage 1: Dependencies Installation Stage

ARG NODE_VERSION=26-slim

FROM node:${NODE_VERSION} AS dependencies

WORKDIR /app

COPY package.json package-lock.json* .npmrc* ./

# Install project dependencies with frozen lockfile for reproducible builds
RUN --mount=type=cache,target=/root/.npm \
  if [ -f package-lock.json ]; then \
    npm ci --ignore-scripts --no-audit --no-fund; \
  else \
    echo "No lockfile found." && exit 1; \
  fi

### Stage 2: Build Next.js application in standalone mode

FROM node:${NODE_VERSION} AS builder

WORKDIR /app

# Copy project dependencies from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

COPY . .

ENV NODE_ENV=production

# https://nextjs.org/telemetry
# disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js application
RUN if [ -f package-lock.json ]; then \
    npm run build; \
  else \
    echo "No lockfile found." && exit 1; \
  fi

### Stage 3: Run Next.js application

FROM node:${NODE_VERSION} AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# disable telemetry during the run time.
ENV NEXT_TELEMETRY_DISABLED=1

# Copy production assets
COPY --from=builder --chown=root:root --chmod=755 /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown node:node .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=root:root --chmod=755 /app/.next/standalone ./
COPY --from=builder --chown=root:root --chmod=755 /app/.next/static ./.next/static

USER node

EXPOSE 3000

CMD ["node", "server.js"]
