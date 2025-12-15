FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* tsconfig.json .eslintrc.json .prettierrc ./
RUN npm install --production=false
COPY src ./src
COPY docs ./docs
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=base /app/package.json /app/package-lock.json* /app/
COPY --from=base /app/node_modules /app/node_modules
COPY --from=base /app/dist /app/dist
EXPOSE 3000
CMD ["node", "dist/main.js"]

