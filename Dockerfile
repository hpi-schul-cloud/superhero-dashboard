FROM node:8.9.4

# Prepare folders and install global modules
RUN mkdir /app && npm install --quiet -g nodemon gulp

# Install dependency outside of the app volume
COPY package.json /opt/
RUN cd /opt && npm install
ENV NODE_PATH=/opt/node_modules

# Copy current directory to container
COPY . /app

# Run gulp
RUN  cd /app && gulp

WORKDIR /app

EXPOSE 3033
CMD ["npm", "start"]