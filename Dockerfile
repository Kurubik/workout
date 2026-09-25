# syntax=docker/dockerfile:1

# --- build ---------------------------------------------------------------------------
# Node is only needed to produce the static bundle; the runtime image never sees it.
FROM node:24-alpine AS build
WORKDIR /app

ARG VERSION=dev

# Dependencies first so a source-only edit reuses the layer. `npm ci` is lockfile-exact.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# Fail the image build rather than shipping a shell that cannot boot.
RUN test -f dist/index.html && test -f dist/sw.js && test -f dist/manifest.json

# --- runtime -------------------------------------------------------------------------
# The unprivileged nginx image listens on 8080 and runs as uid 101, so no capability is
# needed and the container never has to start as root.
FROM nginxinc/nginx-unprivileged:1.29-alpine AS runtime

ARG VERSION=dev
LABEL org.opencontainers.image.title="WORKOUT//INDEX" \
      org.opencontainers.image.description="Standalone public exercise catalogue" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.licenses="AGPL-3.0-or-later" \
      org.opencontainers.image.source="https://github.com/Kurubik/workout"

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
