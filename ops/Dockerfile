# syntax=docker/dockerfile:1.7@sha256:a57df69d0ea827fb7266491f2813635de6f17269be881f696fbfdf2d83dda33e

ARG DIVAN_BUILD_MODE=production

FROM node:22.16.0-alpine3.21@sha256:9f3ae04faa4d2188825803bf890792f33cc39033c9241fc6bb201149470436ca AS build

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable \
    && corepack prepare pnpm@10.33.0 --activate \
    && pnpm install --frozen-lockfile

COPY . .

ARG DIVAN_BUILD_MODE
# These are public, reproducible release inputs. Secrets and infrastructure
# credentials must never be accepted as image build arguments.
ARG DIVAN_PUBLIC_ORIGIN
ARG DIVAN_RELEASE_ID
ARG DIVAN_MIN_HAFEZ_COUNT
ARG DIVAN_MIN_RUMI_COUNT
ARG DIVAN_BRANDING_MODE
ARG DIVAN_UNIVERSITY_APPROVAL_ID
ARG SOURCE_DATE_EPOCH
RUN case "$DIVAN_BUILD_MODE" in \
      production) pnpm build:production ;; \
      fixture) pnpm build:fixture ;; \
      *) printf '%s\n' 'DIVAN_BUILD_MODE must be production or fixture.' >&2; exit 64 ;; \
    esac \
    && pnpm verify:dist

FROM caddy:2.10.2-alpine@sha256:4c6e91c6ed0e2fa03efd5b44747b625fec79bc9cd06ac5235a779726618e530d

ARG DIVAN_BUILD_MODE
LABEL org.opencontainers.image.title="DIVAN Open Day" \
      org.opencontainers.image.description="Static DIVAN release; fixture mode is TEST ONLY and MUST NOT be deployed" \
      org.opencontainers.image.divan-build-mode=$DIVAN_BUILD_MODE

# Port 8080 needs no privilege; retaining Caddy's low-port file capability
# would make cap_drop: ALL reject binary execution on Linux.
RUN setcap -r /usr/bin/caddy

COPY --chown=10001:10001 ops/Caddyfile /etc/caddy/Caddyfile
COPY --chown=10001:10001 ops/scripts/container-health.sh /usr/local/bin/divan-health
COPY --from=build --chown=10001:10001 /app/dist /srv

USER 10001:10001
EXPOSE 8080

ENTRYPOINT ["/usr/bin/caddy"]
CMD ["run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
