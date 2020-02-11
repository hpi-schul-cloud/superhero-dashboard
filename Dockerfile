FROM node:10.17-alpine

RUN apk update && apk upgrade && apk add --no-cache autoconf automake build-base make nasm zlib-dev
# Prepare folders and install global modules
#RUN mkdir /app && npm install --quiet -g nodemon gulp
RUN mkdir /app && npm set unsafe-perm true && npm install --quiet -g gulp
WORKDIR /app
# Install dependency outside of the app volume
COPY package.json /opt/
RUN cd /opt && npm install
ENV NODE_PATH=/opt/node_modules

# Copy current directory to container
COPY . /app
ENV SC_THEME=default
ENV TZ=Europe/Berlin
RUN chown -R 1000:1000 /app

EXPOSE 3033
CMD ["npm", "run", "start"]
