# ---- Stage 1: Install production dependencies ----
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then \
      npm ci --omit=dev; \
    else \
      npm install --omit=dev; \
    fi

# ---- Stage 2: Production image ----
FROM node:18-alpine
WORKDIR /app

# Copy production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY . .

# Install sequelize-cli globally for migration/seed commands in entrypoint
RUN npm install -g sequelize-cli

# Make entrypoint executable
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "src/server.js"]
