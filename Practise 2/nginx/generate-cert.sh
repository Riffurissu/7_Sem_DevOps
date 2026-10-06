#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
SSL_DIR="$SCRIPT_DIR/ssl"

mkdir -p "$SSL_DIR"

openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
    -keyout "$SSL_DIR/server.key" \
    -out "$SSL_DIR/server.crt" \
    -subj "/CN=devops-stack.local" \
    -addext "subjectAltName=DNS:devops-stack.local,DNS:localhost,IP:127.0.0.1"

chmod 600 "$SSL_DIR/server.key"
chmod 644 "$SSL_DIR/server.crt"

printf 'Generated self-signed certificate in %s\n' "$SSL_DIR"
