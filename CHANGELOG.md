# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Allowed Types of change: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`

## [Unreleased]

### Added

### Changed

- BC-740 - BC-850 - change ansible vars for docker image and tag

### Fixed

## [26.18.0] - 2021-11-24

- BC-824 - fix dependency update, use node 14 for build and add nvmrc file

## [26.17.0] - 2021-11-16

### Changed

- BC-589 - BC-655 - change auto deployment to a reusable workflow

## [26.16.0] - 2021-11-09

### Changed

 - BC-573 - changing the domain name and tls handling at the ingress on the ansible template

## [26.13.0]

### Changed

 - BC-331 - BC-351 - rename ansible variables for OnePassword

## [26.10.0] - 2021-09-03

### Changed

 - BC-37 - BC-57 - reduce resource consumption for deployed Superhero Dashboard

### Added

 - BC-147 - add dispatch job after build and push job for the main branch
 - BC-38 - BC-129 - Add ansible files for Bosscloud (default)

## [26.9.0] - 2021-08-09

### Changed

- SC-9192 - access feathers and nestjs apps over their dedicated version prefixes

## [26.8.0] - 2021-08-09

### Added

- SC-9177 - allow superheros to delete admins

## [26.6.0] - 2021-07-20

- SC-9142 and SC-9170 - fix deletion of users
- OPS-2574 - Removeing autodeployed branches for developers if branch deleted

## [26.2.1] - 2021-06-25

### Added

- OPS-2492 - changes build pipeline to github actions

## [26.2.0]

### Fixed

- SC-9041 - fixed schools page cannot load

### Added

- SC-6950 - Add Manage school kreis and officialSchoolNumber with dynamic getter
- OPS-1297 - Added Changelog github action
- SC-2483 - Enable tool configuration to contain multiline keys
- SC-7483 - Updating terms of use for all users for each instance separately
- SC-8247 - Update SHD platform with new texts regarding consent upload (fix for modal naming)

## [24.3.1] - 2020-10-07

### Fixed

- SC-7758 - Fixed user information request
- SC-7845 - Fixed changelog github action
- SC-7081 - Fixed user creation: added missing importHash to request
