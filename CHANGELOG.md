### Fixed
- Suites finishing algorithm bugfixes

## [5.0.6] - 2022-09-13
### Fixed
- [#56](https://github.com/reportportal/agent-js-playwright/issues/56) and [#57](https://github.com/reportportal/agent-js-playwright/issues/57)
Error (cannot read property of undefined 'rootSuite').
- Launch finishing for skipped tests with retries.
### Added
- Ability to switch on/off adding Playwright project names to code reference via config property `includePlaywrightProjectNameToCodeReference`.

## [5.0.5] - 2022-07-12
### Fixed
- Error with test steps finishing
- Test steps nesting structure
- Launch mode property support

## [5.0.4] - 2022-05-30
### Fixed
- [#42](https://github.com/reportportal/agent-js-playwright/issues/42) Error when using same filenames
- Error is related to retries due to which the launch is not finish
- [#45](https://github.com/reportportal/agent-js-playwright/issues/45) Agent failed when enabled includeTestSteps

## [5.0.3] - 2022-04-04
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
- Ability to attach screenshots and other files via [test info attachments](https://playwright.dev/docs/api/class-testinfo#test-info-attachments)
- TypeScript definitions provided
### Fixed
- Error when reporting tests without describe blocks
- Escape codes removed from error messages and stacktrace
### Changed
- Package size reduced

## [5.0.0] - 2021-12-16
### Added
- Full compatibility with ReportPortal version 5.* (see [reportportal releases](https://github.com/reportportal/reportportal/releases))
