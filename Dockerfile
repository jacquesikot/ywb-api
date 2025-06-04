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

# Build TypeScript code using npx to ensure commands are found
RUN npx tsc && \
    npx cpx "keys/**/*" build/keys && \
    npx cpx "src/public/**/*" build/src/public && \
    npx cpx "src/views/**/*" build/src/views

# Remove dev dependencies to reduce image size
RUN npm ci --only=production && npm cache clean --force

# Expose the port the app runs on
EXPOSE ${PORT}

# Command to run in production mode
CMD ["npm", "run", "serve"] 