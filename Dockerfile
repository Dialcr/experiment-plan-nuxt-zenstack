FROM node:22-alpine AS deps

RUN apk add --no-cache libc6-compat

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY zenstack/schema.zmodel ./zenstack/schema.zmodel

RUN pnpm install --frozen-lockfile

FROM node:22-alpine AS build

RUN apk add --no-cache libc6-compat

RUN corepack enable

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY . .

ARG DATABASE_URL
ARG SUPABASE_URL
ARG SUPABASE_PUBLIC_KEY

ENV DATABASE_URL=$DATABASE_URL
ENV SUPABASE_URL=$SUPABASE_URL
ENV SUPABASE_PUBLIC_KEY=$SUPABASE_PUBLIC_KEY

RUN pnpm zen generate

RUN pnpm build

RUN pnpm zen migrate deploy

FROM node:22-alpine AS runner

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nitro

WORKDIR /app

COPY --from=build /app/.output ./.output

USER nitro

EXPOSE 3000

ENV HOST=0.0.0.0
ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", ".output/server/index.mjs"]
