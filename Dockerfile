FROM node:14.15.0-alpine
WORKDIR /usr/src/app
COPY package*.json ./
COPY . .
RUN yarn
RUN yarn build

FROM node:14.15.0-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN yarn --production
COPY --from=0 /usr/src/app/build ./build
ENV LOG_FORMAT json
ENV LOG_LEVEL info
CMD ./node_modules/.bin/knex migrate:latest --cwd /usr/src/app/build/src/db  && yarn start
