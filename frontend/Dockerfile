# Frontend image: build the Next.js standalone output, then run it on a slim base.

# ---- Builder ----
FROM node:22-slim AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# NEXT_PUBLIC_* values are inlined at BUILD time. The browser (not the container)
# calls the API, so this must be a host-reachable URL, not the compose hostname.
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# ---- Runner ----
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
# Bind to all interfaces so the published port is reachable from the host.
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Standalone output bundles a minimal server + traced node_modules; static assets
# and public/ are copied alongside it.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
