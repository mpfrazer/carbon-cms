FROM node:20-alpine AS base

FROM base AS builder
WORKDIR /app
COPY package*.json ./
COPY packages/api/package.json ./packages/api/
COPY packages/admin/package.json ./packages/admin/
COPY packages/frontend/package.json ./packages/frontend/
RUN npm ci
COPY packages/admin ./packages/admin
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build -w packages/admin

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/packages/admin/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/packages/admin/.next/static ./.next/static

USER nextjs
ENV PORT=3002
ENV HOSTNAME=0.0.0.0
EXPOSE 3002

CMD ["node", "server.js"]
