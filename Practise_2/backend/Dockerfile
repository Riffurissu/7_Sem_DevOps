FROM golang:1.22-alpine AS builder
WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /out/notes ./cmd/notes

FROM alpine:3.20 AS runtime
RUN apk add --no-cache wget \
    && adduser -D -H app
WORKDIR /app
COPY --from=builder /out/notes ./notes
COPY healthcheck.sh /usr/local/bin/healthcheck
RUN chmod 0555 /usr/local/bin/healthcheck \
    && chown -R app:app /app
USER app
EXPOSE 8000

# Рабочий healthcheck задаётся в docker-compose.yml.
# Альтернативный inline-вариант без скрипта:
# HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
#   CMD wget -qO- http://127.0.0.1:8000/health >/dev/null || exit 1

# Альтернативный вариант через скрипт:
# HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
#   CMD ["/usr/local/bin/healthcheck"]

CMD ["/app/notes"]
