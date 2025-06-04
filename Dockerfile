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

# Install ALL dependencies (including dev dependencies) for build
RUN npm ci

# Install rimraf globally (used in clean script but not in package.json)
RUN npm install -g rimraf

# Copy source code
COPY . .

# Clean any existing build directory
RUN rimraf ./build

# Build TypeScript code step by step
RUN npx tsc

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

# Remove dev dependencies to reduce image size
RUN npm ci --only=production && npm cache clean --force

# Expose the port the app runs on
EXPOSE ${PORT}

# Command to run in production mode
CMD ["npm", "run", "serve"] 