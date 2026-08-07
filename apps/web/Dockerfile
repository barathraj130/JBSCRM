# Build context must be the monorepo root:
#   docker build -f apps/web/Dockerfile -t indiamart-crm-web .

FROM node:20-alpine AS builder
RUN corepack enable
WORKDIR /repo

# Next.js inlines NEXT_PUBLIC_* vars at build time, so this must be a build arg, not a runtime env var.
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @indiamart-crm/shared build
RUN pnpm --filter @indiamart-crm/web build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /repo/apps/web/.next/standalone ./
COPY --from=builder /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /repo/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
