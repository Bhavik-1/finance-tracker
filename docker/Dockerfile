FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies with layer caching
COPY package*.json ./
COPY app/client/package*.json app/client/
COPY app/server/package*.json app/server/
RUN npm ci

# Copy source and build frontend
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Install only backend production dependencies
COPY app/server/package*.json ./app/server/
WORKDIR /app/app/server
RUN npm ci --omit=dev

# Copy backend source
COPY app/server/src ./src

# Copy built frontend artifact from build stage
WORKDIR /app
COPY --from=build /app/app/client/dist ./app/client/dist

EXPOSE 5000

CMD ["node", "app/server/src/index.js"]
