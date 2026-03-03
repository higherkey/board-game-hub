# Stage 1: Build the Angular frontend
FROM node:20 AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build -- --configuration=production

# Stage 2: Build the .NET backend
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS backend-build
WORKDIR /app
COPY backend/BoardGameHub.Api/BoardGameHub.Api.csproj ./BoardGameHub.Api/
RUN dotnet restore BoardGameHub.Api/BoardGameHub.Api.csproj
COPY backend/ ./
# Copy frontend build results into backend's wwwroot
COPY --from=frontend-build /app/frontend/dist/frontend/browser ./BoardGameHub.Api/wwwroot/
RUN dotnet publish BoardGameHub.Api/BoardGameHub.Api.csproj -c Release -o out

# Stage 3: Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=backend-build /app/out .
USER app
EXPOSE 8080
ENTRYPOINT ["dotnet", "BoardGameHub.Api.dll"]
