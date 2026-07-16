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

FROM golang:1.26.5-alpine3.23@sha256:622e56dbc11a8cfe87cafa2331e9a201877271cbff918af53d3be315f3da88cc AS caddy-build

# Caddy 2.11.4's published image was compiled with a Go standard library that
# now has a fixed High-severity CVE. Rebuild the same upstream command with the
# fixed toolchain; the module proxy payload remains authenticated by Go's
# checksum database, and trimpath/build-id removal keeps the output reproducible.
ENV CGO_ENABLED=0 \
    GOTOOLCHAIN=local
RUN go install -trimpath -ldflags='-s -w -buildid=' github.com/caddyserver/caddy/v2/cmd/caddy@v2.11.4 \
    && go version -m /go/bin/caddy | grep -E '^[[:space:]]*mod[[:space:]]+github.com/caddyserver/caddy/v2[[:space:]]+v2.11.4([[:space:]]|$)'

COPY ops/healthcheck/main.go /tmp/divan-health.go
RUN go build -trimpath -ldflags='-s -w -buildid=' -o /go/bin/divan-health /tmp/divan-health.go

FROM scratch

ARG DIVAN_BUILD_MODE
LABEL org.opencontainers.image.title="DIVAN Open Day" \
      org.opencontainers.image.description="Static DIVAN release; fixture mode is TEST ONLY and MUST NOT be deployed" \
      org.opencontainers.image.divan-build-mode=$DIVAN_BUILD_MODE

COPY --from=caddy-build --chown=10001:10001 --chmod=0555 /go/bin/caddy /usr/bin/caddy
COPY --from=caddy-build --chown=10001:10001 --chmod=0555 /go/bin/divan-health /usr/local/bin/divan-health

COPY --chown=10001:10001 ops/Caddyfile /etc/caddy/Caddyfile
COPY --from=build --chown=10001:10001 /app/dist /srv

ENV XDG_CONFIG_HOME=/config \
    XDG_DATA_HOME=/data
USER 10001:10001
EXPOSE 8080

ENTRYPOINT ["/usr/bin/caddy"]
CMD ["run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
