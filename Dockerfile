FROM node:22-alpine

# Install Python and build dependencies
RUN apk add --no-cache python3 make g++ 

# Set NODE_ENV to production
ENV NODE_ENV=production
# Set PORT to match fly.toml internal_port
ENV PORT=5002

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# Expose the port the app runs on
EXPOSE ${PORT}

# Command to run in production mode
CMD ["npm", "run", "serve"] 