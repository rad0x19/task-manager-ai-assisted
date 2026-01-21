FROM node:20-slim AS base

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
# Copy prisma schema before npm install so postinstall can run prisma generate
COPY prisma ./prisma
RUN npm install

FROM base AS dev
COPY . .
RUN npx prisma generate
CMD ["npm", "run", "dev"]

FROM base AS production
COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

CMD ["npm", "start"]
