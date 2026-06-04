# superhero-dashboard

The superhero-dashboard is the UI for instance-wide configuration and data manipulation in the [Schulcloud](https://github.com/hpi-schul-cloud) ecosystem. It is a client-server application based on [Handlebars](https://handlebarsjs.com/) and [Express.js](https://expressjs.com/en/). It communicates with the [schulcloud-server](https://github.com/hpi-schul-cloud/schulcloud-server) via HTTP.

## Requirements

* Node.js and npm must be installed in the versions specified in package.json.

## Installation and start

1. Run `npm install`.
1. Run `npm run build` to build static files.
1. Run `npm run watch` (or another start script from package.json) to start the application.

For a full walkthrough of the local development environment, see the [Getting Started guide](https://documentation.dbildungscloud.dev/docs/getting-started).
