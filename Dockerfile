# syntax=docker/dockerfile:1
FROM node:24-alpine AS deps
WORKDIR /app
ENV NODE_ENV=development
RUN apk add --no-cache libc6-compat
COPY package*.json ./
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/build ./build
EXPOSE 3100
ENV PORT=3100
CMD ["node", "build"]
