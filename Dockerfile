FROM node:20-alpine AS builder
WORKDIR /app
# Install client deps and build
COPY client/package*.json ./client/
RUN cd client && npm install --legacy-peer-deps
COPY client/ ./client/
RUN cd client && npm run build

FROM node:20-alpine
WORKDIR /app
# Install server deps
COPY server/package*.json ./server/
RUN cd server && npm install --production
COPY server/ ./server/
# Copy built client
COPY --from=builder /app/client/dist ./client/dist
# Copy questions for seeding
COPY questions/ ./questions/

ENV NODE_ENV=production
WORKDIR /app/server
CMD ["node", "index.js"]
