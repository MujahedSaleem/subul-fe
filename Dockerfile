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
RUN pnpm store prune && pnpm install --prod

# Stage 2: Install all dependencies and build the app
FROM base AS build
COPY package.json pnpm-lock.yaml ./
RUN pnpm store prune && pnpm install
COPY . .
RUN pnpm run build

# Stage 3: Final image with a simple static server
FROM node:20-slim

# Install serve globally to serve static files
RUN npm install -g serve

# Copy built artifacts
COPY --from=build /app/dist /app

# Expose port 3000
EXPOSE 3000

# Start serve
CMD ["serve", "-s", "/app", "-l", "3000"]