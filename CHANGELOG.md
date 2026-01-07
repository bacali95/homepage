# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [2.3.2](https://github.com/bacali95/homepage/compare/v2.3.1...v2.3.2) (2026-01-07)


### Bug Fixes

* handle AbortError in PingService ([18e4964](https://github.com/bacali95/homepage/commit/18e49649aadc83e45736e94c17b9208cb2a18da3))

### [2.3.1](https://github.com/bacali95/homepage/compare/v2.3.0...v2.3.1) (2026-01-04)


### Code Refactoring

* enhance responsive design across components ([d4a7774](https://github.com/bacali95/homepage/commit/d4a7774056f0006db5995cdd017720f25e944f9e))

## [2.3.0](https://github.com/bacali95/homepage/compare/v2.2.1...v2.3.0) (2026-01-04)


### Features

* integrate PWA support with vite-plugin-pwa ([51c2f43](https://github.com/bacali95/homepage/commit/51c2f4308420a1b8f9f0aba4e8692ebb76994df9))


### Bug Fixes

* improve UI responsiveness ([0307fc8](https://github.com/bacali95/homepage/commit/0307fc8bafa5d540ce1c6d64bc148c96562f3fd0))

### [2.2.1](https://github.com/bacali95/homepage/compare/v2.2.0...v2.2.1) (2026-01-04)


### Bug Fixes

* update build command in Docker workflow to use 'bun run build' for consistency ([ded6f25](https://github.com/bacali95/homepage/commit/ded6f2530f8c64e134b26200875c015797b19f84))
* update Docker build command to include DATABASE_URL for local database configuration ([18d5ee2](https://github.com/bacali95/homepage/commit/18d5ee28bc5af9ab33c124326c614daadf348a65))


### Code Refactoring

* streamline Dockerfile and remove Dockerfile.test ([6187d8a](https://github.com/bacali95/homepage/commit/6187d8a8366f6c088352ff4ea8e187eb230d8c6f))

## [2.2.0](https://github.com/bacali95/homepage/compare/v2.1.0...v2.2.0) (2026-01-04)

## [2.1.0](https://github.com/bacali95/homepage/compare/v2.0.7...v2.1.0) (2025-12-18)


### Features

* **AppVersionPreference:** Add versionExtractionRegex field and update version comparison logic ([1d9aae9](https://github.com/bacali95/homepage/commit/1d9aae97d83fb256e8d76264b7f0fe810b9ff58d))

### [2.0.7](https://github.com/bacali95/homepage/compare/v2.0.6...v2.0.7) (2025-12-14)


### Features

* **useTheme:** Refactor theme handling to improve responsiveness to system preferences ([9549198](https://github.com/bacali95/homepage/commit/9549198e0c683d8f3a3c0569685a440cf92a32c3))

### [2.0.6](https://github.com/bacali95/homepage/compare/v2.0.5...v2.0.6) (2025-12-14)

### [2.0.5](https://github.com/bacali95/homepage/compare/v2.0.4...v2.0.5) (2025-12-13)


### Bug Fixes

* **PingHistory:** Enhance ping history retrieval with ordering and open state management ([7225087](https://github.com/bacali95/homepage/commit/7225087fa6520b12a5db92ec4012331b34e04b49))

### [2.0.4](https://github.com/bacali95/homepage/compare/v2.0.3...v2.0.4) (2025-12-13)


### Features

* **NotificationPreferences:** Integrate channel configurations into notification preferences display ([989cece](https://github.com/bacali95/homepage/commit/989cecece373738991f1b5774fe71aa107c7a55c))

### [2.0.3](https://github.com/bacali95/homepage/compare/v2.0.2...v2.0.3) (2025-12-13)


### Features

* **docker:** Add docker-compose configuration for testing environment ([1c87275](https://github.com/bacali95/homepage/commit/1c87275e6c62db8b2e26d9ccbcbb821b82b2a37a))

### [2.0.2](https://github.com/bacali95/homepage/compare/v2.0.1...v2.0.2) (2025-12-13)


### Bug Fixes

* **Dockerfile:** Change CMD to ENTRYPOINT for better script execution ([b2e1794](https://github.com/bacali95/homepage/commit/b2e1794ef4da2d13fe890f224719153e21fd0c02))

### [2.0.1](https://github.com/bacali95/homepage/compare/v2.0.0...v2.0.1) (2025-12-13)


### Bug Fixes

* **Dockerfile:** Update CMD instruction to use absolute path for start script ([f1a0239](https://github.com/bacali95/homepage/commit/f1a0239ae79c4e488dd7e7745450232b236b2959))

## [2.0.0](https://github.com/bacali95/homepage/compare/v1.12.1...v2.0.0) (2025-12-13)


### Features

* Enhance application structure and functionality ([a125ed9](https://github.com/bacali95/homepage/commit/a125ed95104e21ae7a8429ab7fbad0184148543b))


### Bug Fixes

* **prisma:** Update client output path in schema.prisma for correct generation location ([e7d2cf0](https://github.com/bacali95/homepage/commit/e7d2cf083c0b5130faa4c6e480fc01c95796fa85))

### [1.12.1](https://github.com/bacali95/homepage/compare/v1.12.0...v1.12.1) (2025-12-09)


### Code Refactoring

* **ping:** Remove debug log from PingService and enhance SettingsMenu with version display ([6bbb63c](https://github.com/bacali95/homepage/commit/6bbb63caab4a1eade77aa562bd1c33bee42fc1e4))

## [1.12.0](https://github.com/bacali95/homepage/compare/v1.11.1...v1.12.0) (2025-12-09)


### Features

* **ping:** Add ping_ignore_ssl option for SSL certificate error handling ([d663c15](https://github.com/bacali95/homepage/commit/d663c153144cfe432a7e52f1bbf383456ebd5ec3))

### [1.11.1](https://github.com/bacali95/homepage/compare/v1.11.0...v1.11.1) (2025-12-09)

## [1.11.0](https://github.com/bacali95/homepage/compare/v1.10.4...v1.11.0) (2025-12-07)


### Features

* **ping:** Implement ping monitoring feature for applications ([ae101ac](https://github.com/bacali95/homepage/commit/ae101ac00fabd7f4560dc555c5afc72af0355843))


### Code Refactoring

* **app-form:** Restructure AppForm components and enhance routing ([3258e50](https://github.com/bacali95/homepage/commit/3258e505d0ac7ce9d8eab19b6b93c95130d3456e))

### [1.10.4](https://github.com/bacali95/homepage/compare/v1.10.3...v1.10.4) (2025-12-03)


### Code Refactoring

* Introduce isVersionsDifferent utility for version comparison ([78fe7a5](https://github.com/bacali95/homepage/commit/78fe7a52a95d8d65a2b4bdb87664a9d8b2c28426))

### [1.10.3](https://github.com/bacali95/homepage/compare/v1.10.2...v1.10.3) (2025-12-03)


### Code Refactoring

* **tags-fetchers:** Simplify tag handling and response transformation ([b505c71](https://github.com/bacali95/homepage/commit/b505c71595bb82373712c07a865d44e53e213372))

### [1.10.2](https://github.com/bacali95/homepage/compare/v1.10.1...v1.10.2) (2025-12-03)


### Code Refactoring

* **GithubReleasesFetcherService:** Simplify release fetching logic ([df85439](https://github.com/bacali95/homepage/commit/df85439e35097adea8468610bed73b2e10883213))

### [1.10.1](https://github.com/bacali95/homepage/compare/v1.10.0...v1.10.1) (2025-12-01)


### Bug Fixes

* Remove exclusion of API routes from static file serving ([d78a549](https://github.com/bacali95/homepage/commit/d78a549cfc2b82d94f6b41e2fa9b71ba78a2ded2))

## [1.10.0](https://github.com/bacali95/homepage/compare/v1.9.0...v1.10.0) (2025-12-01)


### Features

* Add Prettier and ESLint configuration ([c2cd730](https://github.com/bacali95/homepage/commit/c2cd730a2dd15b53f4ad9cdc627f4cf6fe6c792e))

## [1.9.0](https://github.com/bacali95/homepage/compare/v1.8.0...v1.9.0) (2025-11-30)

### Features

- Refactor app structure and enhance routing ([a27fc53](https://github.com/bacali95/homepage/commit/a27fc53ff4f163c64a346dd3b2b791a5c040980d))

## [1.8.0](https://github.com/bacali95/homepage/compare/v1.7.0...v1.8.0) (2025-11-30)

### Features

- Implement notification system for app updates ([5281db1](https://github.com/bacali95/homepage/commit/5281db191267aad7a0c975c3c0f23c035640b2ea))

## [1.7.0](https://github.com/bacali95/homepage/compare/v1.6.1...v1.7.0) (2025-11-24)

### Features

- Add function to extract semantic version from tag ([6c22327](https://github.com/bacali95/homepage/commit/6c223274c5bee22903478f7b499a1feb620f6062))

### [1.6.1](https://github.com/bacali95/homepage/compare/v1.6.0...v1.6.1) (2025-11-22)

### Features

- Integrate icon field into app form ([72db97c](https://github.com/bacali95/homepage/commit/72db97c3b30fc42cfc84a213ae2ba46b72d783db))

## [1.6.0](https://github.com/bacali95/homepage/compare/v1.5.4...v1.6.0) (2025-11-22)

### Features

- Add icon support for apps ([71d619e](https://github.com/bacali95/homepage/commit/71d619ebe3c1bded69b4f150aeebee8fa94f28eb))

### [1.5.4](https://github.com/bacali95/homepage/compare/v1.5.2...v1.5.4) (2025-11-19)

### Bug Fixes

- Update cron schedule for UpdateCheckerJob to run every hour ([ff5842b](https://github.com/bacali95/homepage/commit/ff5842bc2fb9229d261bff7aef6f13a3c7c18579))

### Code Refactoring

- Remove Releases module and related components ([278f588](https://github.com/bacali95/homepage/commit/278f588822c25fcaba094bc7eda6978852063bec))
- Remove Releases module and related components ([41a68ec](https://github.com/bacali95/homepage/commit/41a68ecfa89edd2d020e02b0add7a1f2b14d48da))

### [1.5.3](https://github.com/bacali95/homepage/compare/v1.5.2...v1.5.3) (2025-11-17)

### Code Refactoring

- Remove Releases module and related components ([ac4c9ee](https://github.com/bacali95/homepage/commit/ac4c9eec9eff1ed23d3c46a371b88adc4682ef88))

### [1.5.2](https://github.com/bacali95/homepage/compare/v1.5.1...v1.5.2) (2025-11-15)

### Features

- Add double-click functionality to open app URL in a new tab ([f06d8b4](https://github.com/bacali95/homepage/commit/f06d8b4c783b5d4c3e975b1149a5b311170eb35b))

### [1.5.1](https://github.com/bacali95/homepage/compare/v1.5.0...v1.5.1) (2025-11-15)

### Code Refactoring

- Further simplify app validation by removing redundant checks ([50eed64](https://github.com/bacali95/homepage/commit/50eed6454c9482b1c92e8ce22c5c0f55733607a3))

## [1.5.0](https://github.com/bacali95/homepage/compare/v1.4.3...v1.5.0) (2025-11-15)

### Code Refactoring

- Simplify app validation and update handling ([02ed0ad](https://github.com/bacali95/homepage/commit/02ed0ad345307f8dc325ed5665368b84f191a5ff))

### [1.4.3](https://github.com/bacali95/homepage/compare/v1.4.2...v1.4.3) (2025-11-15)

### [1.4.2](https://github.com/bacali95/homepage/compare/v1.4.1...v1.4.2) (2025-11-15)

### Bug Fixes

- Update updateAppWithLatestVersion to use runningVersion for comparison ([3908587](https://github.com/bacali95/homepage/commit/3908587caa3e5a7d6248a2cfb1ae2f6aca099336))

### [1.4.1](https://github.com/bacali95/homepage/compare/v1.4.0...v1.4.1) (2025-11-15)

### Bug Fixes

- Update Dockerfile to start server with main.js instead of index.js ([09d64a9](https://github.com/bacali95/homepage/commit/09d64a9542869c9a25d667a37951718d3520202b))

## [1.4.0](https://github.com/bacali95/homepage/compare/v1.3.0...v1.4.0) (2025-11-15)

### Features

- Integrate PodsModule and refactor K8sPodUpdaterService ([3d926ef](https://github.com/bacali95/homepage/commit/3d926ef4734a66f1765a226a60b3d117fb1fcf9c))

## [1.3.0](https://github.com/bacali95/homepage/compare/v1.2.1...v1.3.0) (2025-11-13)

### Features

- Implement NestJS structure with modules, services, and controllers ([f2633bc](https://github.com/bacali95/homepage/commit/f2633bc73abba6ad9116fbf37d4cee6553d4395f))

### [1.2.1](https://github.com/bacali95/homepage/compare/v1.2.0...v1.2.1) (2025-11-13)

## [1.2.0](https://github.com/bacali95/homepage/compare/v1.1.1...v1.2.0) (2025-11-13)

### [1.1.1](https://github.com/bacali95/homepage/compare/v1.1.0...v1.1.1) (2025-11-13)

## [1.1.0](https://github.com/bacali95/homepage/compare/v1.0.1...v1.1.0) (2025-11-13)

### [1.0.1](https://github.com/bacali95/homepage/compare/v1.0.0...v1.0.1) (2025-11-13)
