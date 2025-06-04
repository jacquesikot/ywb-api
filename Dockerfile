FROM node:22-alpine

# Install Python and build dependencies
RUN apk add --no-cache python3 make g++ 

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies) for build
# Set NODE_ENV to development during build to ensure all dependencies are available
ENV NODE_ENV=development
RUN npm ci

# Install rimraf globally (used in clean script but not in package.json)
RUN npm install -g rimraf

# Copy source code
COPY . .

# Clean any existing build directory
RUN rimraf ./build

# Debug: Show TypeScript version and check basic setup
RUN npx tsc --version
RUN ls -la node_modules/.bin/ | grep tsc

# Build TypeScript code step by step with verbose output
RUN npx tsc --listFiles --pretty

# Copy additional files (create directories if they don't exist and handle empty directories)
RUN mkdir -p build/keys && \
    if [ "$(ls -A keys 2>/dev/null)" ]; then \
        npx cpx "keys/**/*" build/keys; \
    fi

RUN mkdir -p build/src/public && \
    if [ "$(ls -A src/public 2>/dev/null)" ]; then \
        npx cpx "src/public/**/*" build/src/public; \
    fi

RUN mkdir -p build/src/views && \
    if [ "$(ls -A src/views 2>/dev/null)" ]; then \
        npx cpx "src/views/**/*" build/src/views; \
    fi

# Now switch to production environment and clean up
ENV NODE_ENV=production
ENV PORT=5002

# Remove dev dependencies to reduce image size
RUN npm ci --only=production && npm cache clean --force

# Expose the port the app runs on
EXPOSE ${PORT}

# Command to run in production mode
CMD ["npm", "run", "serve"] 