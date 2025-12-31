FROM node:20-alpine AS build
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy everything else and build
COPY . .
RUN npm run build -- --configuration production

# Build runtime image (nginx)
FROM nginx:alpine
COPY --from=build /app/dist/frontend /usr/share/nginx/html
# If there's a custom nginx config needed for SPA routing, add it here
# COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
