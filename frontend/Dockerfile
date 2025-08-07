# --- Build Stage ---
FROM node:20-buster-slim AS build-stage

WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) first to leverage Docker cache
# This layer will only be rebuilt if package*.json changes
COPY package*.json ./

# Clean npm cache and then perform a clean install.
# npm ci is generally better for CI/CD environments as it uses package-lock.json
RUN npm cache clean --force
RUN npm ci

# --- Diagnostic Step (Optional, but good for debugging) ---
# List contents of node_modules to verify papaparse is there
RUN echo "--- Listing node_modules/papaparse ---" && ls -al node_modules/papaparse || echo "papaparse not found in node_modules"
RUN echo "--- Listing node_modules/@tanstack/react-table ---" && ls -al node_modules/@tanstack/react-table || echo "@tanstack/react-table not found in node_modules"

# Verify if @tanstack/react-table and papaparse are accessible
RUN node -e "require('@tanstack/react-table')" || (echo "ERROR: @tanstack/react-table module not found during require check" && exit 1)
RUN node -e "require('papaparse')" || (echo "ERROR: papaparse module not found during require check" && exit 1)

# Copy the rest of your application code
# This step will invalidate cache if any other file changes
COPY . .

# Run Vite build to create the production-ready static assets (e.g., in /app/dist).
# No need for an extra `npm install` here if `npm ci` worked correctly.
RUN npm run build

# --- Production Stage ---
FROM nginx:stable-alpine AS production-stage

# Copy the build output from the build-stage to Nginx's public directory
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy the Nginx custom configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 (default for Nginx)
EXPOSE 80

# Command to start Nginx
CMD ["nginx", "-g", "daemon off;"]