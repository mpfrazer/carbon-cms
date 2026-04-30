FROM node:20-alpine AS base

FROM base AS builder
WORKDIR /app
COPY package*.json ./
COPY packages/api/package.json ./packages/api/
COPY packages/admin/package.json ./packages/admin/
COPY packages/frontend/package.json ./packages/frontend/
RUN npm ci
COPY packages/frontend ./packages/frontend
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build -w packages/frontend

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/packages/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/packages/frontend/.next/static ./.next/static

USER nextjs
ENV PORT=3003
ENV HOSTNAME=0.0.0.0
EXPOSE 3003

CMD ["node", "server.js"]
