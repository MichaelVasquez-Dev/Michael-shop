FROM node:25-alpine3.23 AS dev
COPY package.json .
RUN yarn install
COPY . .
RUN yarn run start:dev

FROM node:25-alpine3.23 AS dependencies
WORKDIR /app
COPY package.json .
RUN yarn install

FROM node:25-alpine3.23 AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN yarn run build

FROM node:25-alpine3.23 AS prod
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package.json .
EXPOSE 3000
RUN yarn install --prod
CMD ["yarn", "start:prod"]