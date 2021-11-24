FROM docker.io/library/node:14-alpine

ENV TZ=Europe/Berlin
EXPOSE 3033

RUN apk add --no-cache autoconf automake build-base make nasm zlib-dev

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force
COPY . .
RUN node node_modules/gulp/bin/gulp.js

CMD ["npm", "run", "start"]
