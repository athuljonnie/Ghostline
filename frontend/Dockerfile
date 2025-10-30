# Frontend Dockerfile for Development
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first (for better layer caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Don't copy source files - they'll be mounted as volumes
# This allows hot reload to work properly

# Expose Vite dev server port
EXPOSE 5173

# Start development server with hot reload
CMD ["npm", "run", "dev"]
