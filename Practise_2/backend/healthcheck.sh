#!/bin/sh
set -eu

response=$(wget -qO- http://127.0.0.1:8000/health)
case "$response" in
    *'"status":"ok"'*'"db":true'*|*'"db":true'*'"status":"ok"'*) exit 0 ;;
    *) exit 1 ;;
esac
