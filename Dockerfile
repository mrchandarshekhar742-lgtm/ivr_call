# Multi-stage Docker build for production

# Backend Stage
FROM node:18-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY backend/ ./

# Frontend Stage
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Production Stage
FROM node:18-alpine AS production
WORKDIR /app

# Install PM2 globally
RUN npm install -g pm2

# Copy backend
COPY --from=backend-builder /app/backend ./backend
WORKDIR /app/backend

# Copy frontend build
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/public ./frontend/public
COPY --from=frontend-builder /app/frontend/package.json ./frontend/

# Create necessary directories
RUN mkdir -p logs uploads/audio uploads/csv

# Set permissions
RUN chown -R node:node /app
USER node

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Expose ports
EXPOSE 5000 8080

# Start application
CMD ["pm2-runtime", "start", "ecosystem.config.js", "--env", "production"]