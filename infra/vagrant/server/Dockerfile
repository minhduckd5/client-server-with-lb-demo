# ✅ Use official Node 22 image (Alpine is fine)
FROM node:22-alpine

WORKDIR /server
# ✅ Install pnpm globally
RUN npm install -g pnpm

# ✅ Enable pnpm via Corepack
RUN corepack enable

# ✅ Copy only lock and manifest first (for layer caching)
COPY package.json pnpm-lock.yaml* ./

# ✅ Install dependencies
RUN pnpm install --frozen-lockfile

# ✅ Copy the rest of the app
COPY . .

# ✅ Default command
CMD ["pnpm", "start"]
