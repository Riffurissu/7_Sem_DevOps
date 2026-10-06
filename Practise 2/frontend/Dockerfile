FROM node:22-alpine AS builder
WORKDIR /src

COPY package.json ./
COPY package-lock.json ./
RUN npm ci --ignore-scripts
COPY build.mjs preview.mjs ./
COPY src ./src

RUN --mount=type=secret,id=release_version,target=/run/secrets/release_version \
    export VITE_RELEASE_VERSION="$(cat /run/secrets/release_version)" && \
    npm run build

FROM nginx:1.27-alpine AS runtime
COPY --from=builder /src/dist /usr/share/nginx/html
EXPOSE 80
