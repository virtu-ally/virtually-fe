FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port 5173 (Vite default)
EXPOSE 5173

# Start the Vite dev server with host flag to allow external access
CMD ["npm", "run", "host"]
