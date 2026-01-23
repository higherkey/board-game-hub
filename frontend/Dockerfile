FROM node:20-alpine AS build
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy everything else and build
COPY . .
ARG CONFIGURATION=production
RUN npm run build -- --configuration $CONFIGURATION

# Build runtime image (nginx)
FROM nginxinc/nginx-unprivileged:alpine
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
# If there's a custom nginx config needed for SPA routing, add it here
# COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
