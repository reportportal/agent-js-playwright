### Added
- `launchId` option to the config to attach run results to an existing launch. Related to parallel execution on one and several machines [#86](https://github.com/reportportal/agent-js-playwright/issues/86).
- `uploadVideo` and `uploadTrace` options to the config to disable auto-attaching the Playwright's [video](https://playwright.dev/docs/api/class-testoptions#test-options-video) and [trace](https://playwright.dev/docs/api/class-testoptions#test-options-trace). Addressed [#98](https://github.com/reportportal/agent-js-playwright/issues/98).
### Changed
- `@reportportal/client-javascript` bumped to version `5.0.11`.

## [5.0.11] - 2023-04-13
### Fixed
- Errors in case of Playwright doesn't provide the internal `_staticAnnotations` property to the `TestCase`s.
### Added
- [`printsToStdio`](https://playwright.dev/docs/api/class-reporter#reporter-prints-to-stdio) method implemented. Now the Playwright will provide additional output to the terminal to enhance user experience in case of only `@reportportal/agent-js-playwright` reporter used.

## [5.0.10] - 2023-04-12
### Fixed
- Issue with suites finishing after run interruption via Playwright [`globalTimeout`](https://playwright.dev/docs/api/class-testconfig#test-config-global-timeout).

## [5.0.9] - 2023-03-21
### Fixed
- Issue [#79](https://github.com/reportportal/agent-js-playwright/issues/79) with duplicating tests with wrong statuses using `testInfo.fail()`.
- Issue [#85](https://github.com/reportportal/agent-js-playwright/issues/85) with suites finishing when retrying statically annotated (`.fixme()` or `.skip()`) tests. The issue still reproducible in some rare cases, refer [Issues troubleshooting](./README.md#issues-troubleshooting) for details.
### Changed
- `testCase.outcome()` used instead of `testResult.status` to calculate the final status for the test case in RP. Thanks to [clouddra](https://github.com/clouddra).
- `testCase.id` used instead of full test path to identify the test case.
- `engines` field in `package.json`. The agent supports the minimal version of `Node.js` required by `@playwright/test` (>=14).
- TypeScript compilation target changed to ES6.
- Docs [Attachments](./README.md#attachments) section actualized.
- `@reportportal/client-javascript` bumped to version `5.0.8`.

## [5.0.8] - 2022-09-28
### Fixed
- Issue [#46](https://github.com/reportportal/agent-js-playwright/issues/46) with suites finishing when retrying skipped tests.
- Issue [#69](https://github.com/reportportal/agent-js-playwright/issues/69) with wrong logs attaching.

## [5.0.7] - 2022-09-15
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
