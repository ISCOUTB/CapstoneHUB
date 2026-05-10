# reference source: https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile
### Stage 1: Dependencies Installation Stage

ARG NODE_VERSION=24-slim

FROM node:${NODE_VERSION} AS dependencies

WORKDIR /app

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./

# Install project dependencies with frozen lockfile for reproducible builds
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/usr/local/share/.cache/yarn \
    --mount=type=cache,target=/root/.local/share/pnpm/store \
  if [ -f package-lock.json ]; then \
    npm ci --no-audit --no-fund; \
  elif [ -f yarn.lock ]; then \
    corepack enable yarn && yarn install --frozen-lockfile --production=false; \
  elif [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm install --frozen-lockfile; \
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
  elif [ -f yarn.lock ]; then \
    corepack enable yarn && yarn build; \
  elif [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm build; \
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
<<<<<<< HEAD
COPY --from=builder --chown=root:root --chmod=755 /app/public ./public
=======
COPY --from=builder --chown=node:node --chmod=755 /app/public ./public
>>>>>>> cf8dddd3809c97f036bf6a89f0c02e18ba533361

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown node:node .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
<<<<<<< HEAD
COPY --from=builder --chown=root:root --chmod=755 /app/.next/standalone ./
COPY --from=builder --chown=root:root --chmod=755 /app/.next/static ./.next/static
=======
COPY --from=builder --chown=node:node --chmod=755 /app/.next/standalone ./
COPY --from=builder --chown=node:node --chmod=755 /app/.next/static ./.next/static
>>>>>>> cf8dddd3809c97f036bf6a89f0c02e18ba533361

USER node

EXPOSE 3000

CMD ["node", "server.js"]
