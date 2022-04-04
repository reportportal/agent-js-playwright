### Added
- Ability include test steps to the report on log level via config property `includeTestSteps`.
### Fixed
- The correct end time for suites is now displayed.

## [5.0.2] - 2022-02-04
### Added
- Ability to attach logs to items via `console.*` [methods](./README.md#logging)
### Fixed
- [#26](https://github.com/reportportal/agent-js-playwright/issues/26) Error when value is not allowed for field 'status'

## [5.0.1] - 2022-01-17
### Added
- Ability to attach screenshots and other files via [test info attachments](https://playwright.dev/docs/1.17/api/class-testinfo#test-info-attachments)
- TypeScript definitions provided
### Fixed
- Error when reporting tests without describe blocks
- Escape codes removed from error messages and stacktrace
### Changed
- Package size reduced

## [5.0.0] - 2021-12-16
### Added
- Full compatibility with ReportPortal version 5.* (see [reportportal releases](https://github.com/reportportal/reportportal/releases))
