FROM docker.io/node:22-alpine

ENV TZ=Europe/Berlin
EXPOSE 3033

RUN apk add --no-cache \
    autoconf \
    automake \
    build-base \
    make \
    nasm \
    python3

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts && npm cache clean --force

COPY bin /app/bin
COPY controllers /app/controllers
COPY helpers /app/helpers
COPY static /app/static
COPY theme /app/theme
COPY views /app/views
COPY api.js /app/api.js
COPY app.js /app/app.js
COPY gulpfile.js /app/gulpfile.js

#RUN export NODE_OPTIONS=--openssl-legacy-provider && node node_modules/gulp/bin/gulp.js
RUN npx gulp

CMD ["npm", "run", "start"]
