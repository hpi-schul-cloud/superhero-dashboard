FROM docker.io/library/node:14-alpine

WORKDIR /app
COPY . /app
ENV TZ=Europe/Berlin
EXPOSE 3033
RUN chown -R 1000:1000 /app
CMD ["npm", "run", "start"]
