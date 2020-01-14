# SuperHero-Dashboard

[![Greenkeeper badge](https://badges.greenkeeper.io/schul-cloud/superhero-dashboard.svg)](https://greenkeeper.io/)

## Requirements

* node.js 6 or later (You can install it from https://nodejs.org/en/download/)

## Setup

1. Clone directory into local folder
2. Go into the cloned folder and enter `npm install`
3. Install nodemon and gulp globally by entering `npm install -g nodemon gulp`

## Run

1. Start the [schul-cloud server](https://github.com/schulcloud/schulcloud-server)
2. Go into superhero project folder
3. run `gulp watch` to run gulp
4. run `npm run watch` to boot the application OR use `npm run debug` to run with --inspect:9311 to debug the application on port 9311
5. go to `http://localhost:3033`
6. you need a user with superhero role to login, maybe you need to modify your database to add this role to a user of your choice

## Theming

Add Themes to /theme directory. Call gulp and node with SC_THEME set to name of directory.
then clear build files and gulp cache with `gulp clear`

### Windows
 run `set SC_THEME={themeName}` without spaces around the equal sign!

## Environment Variables
- SC_NAV_TITLE
- HOST
- PORT
- SC_THEME
- BACKEND_URL

## How to name your branch

1. Take the last part of the url of your Trello ticket (e.g. "8-setup-feathers-js")
2. Name the branch after the Trello id (e.g. "8-setup-feathers-js")

## Commiting

Default branch: master

1. Go into project folder
2. Run the tests (see above)
3. Commit with a meanigful commit message(!) even at 4 a.m. and not stuff like "dfsdfsf"
4. Checkout to master branch
5. Run `git pull`
6. Checkout to the branch you want to upload
7. run `git rebase -p develop` (not `git merge`!) and solve merge conflicts if needed
8. run `git push`
