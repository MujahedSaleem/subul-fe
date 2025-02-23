# Base image with Node.js
FROM node:20-slim AS base

# Install pnpm globally using npm
RUN npm install -g pnpm@latest

# Set the PNPM_HOME environment variable and update the PATH
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Copy application files and set the working directory
WORKDIR /app

# Stage 1: Install production dependencies
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm store prune && pnpm install --prod --frozen-lockfile

# Stage 2: Install all dependencies and build the app
FROM base AS build
COPY package.json pnpm-lock.yaml ./
RUN pnpm store prune && pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# Stage 3: Final image with Nginx for serving static files
FROM nginx:alpine

# Copy custom Nginx configuration if needed
COPY nginx.conf /etc/nginx/nginx.conf

# Copy production dependencies and build artifacts
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80 (default HTTP port)
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]