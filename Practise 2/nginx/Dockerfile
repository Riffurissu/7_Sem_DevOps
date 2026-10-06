# syntax=docker/dockerfile:1.7

FROM alpine:3.20 AS cert-builder
RUN apk add --no-cache ca-certificates

RUN --mount=type=secret,id=cert_key,target=/run/secrets/server.key \
    --mount=type=secret,id=cert_crt,target=/run/secrets/server.crt \
    mkdir -p /etc/nginx-ssl \
    && cp /run/secrets/server.key /etc/nginx-ssl/server.key \
    && cp /run/secrets/server.crt /etc/nginx-ssl/server.crt \
    && chmod 600 /etc/nginx-ssl/server.key \
    && chmod 644 /etc/nginx-ssl/server.crt

FROM nginx:1.27-alpine AS runtime
RUN rm -f /etc/nginx/conf.d/default.conf
COPY conf.d/default.conf /etc/nginx/conf.d/default.conf
COPY --from=cert-builder /etc/nginx-ssl/ /etc/nginx/ssl/

RUN chown -R nginx:nginx /etc/nginx/ssl \
    && chmod 600 /etc/nginx/ssl/server.key \
    && chmod 644 /etc/nginx/ssl/server.crt

EXPOSE 80 8443

HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
    CMD wget -qO- --no-check-certificate https://127.0.0.1:8443/healthz || exit 1
