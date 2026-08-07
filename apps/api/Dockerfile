# Build context must be the monorepo root:
#   docker build -f apps/api/Dockerfile -t indiamart-crm-api .

FROM node:20-alpine AS build
RUN apk add --no-cache openssl libc6-compat
RUN corepack enable
WORKDIR /repo

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @indiamart-crm/shared build
RUN pnpm --filter @indiamart-crm/api exec prisma generate
RUN pnpm --filter @indiamart-crm/api build
RUN rm -rf apps/web

FROM node:20-alpine AS runtime
RUN apk add --no-cache openssl libc6-compat
RUN corepack enable
WORKDIR /repo

COPY --from=build /repo .
WORKDIR /repo/apps/api

ENV NODE_ENV=production
EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
