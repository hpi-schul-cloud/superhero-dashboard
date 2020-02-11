FROM node:8-alpine

RUN apk update && apk upgrade && apk add --no-cache autoconf automake build-base make nasm zlib-dev
# Prepare folders and install global modules
RUN mkdir /app && set unsafe-perm true && npm install --quiet -g nodemon gulp

# Install dependency outside of the app volume
COPY package.json /opt/
RUN cd /opt && npm install
ENV NODE_PATH=/opt/node_modules

# Copy current directory to container
COPY . /app
RUN chown -R 1000:1000 ./app
WORKDIR /app

EXPOSE 3033
CMD ["npm", "run", "start"]
