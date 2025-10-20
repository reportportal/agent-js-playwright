# @reportportal/agent-js-playwright

Agent to integrate Playwright with ReportPortal.

- More about [Playwright](https://playwright.dev/)
- More about [ReportPortal](http://reportportal.io/)

## Example

Look through the [example-playwright](https://github.com/reportportal/examples-js/tree/main/example-playwright) to check out the integration in action.

## Installation

Install the agent in your project:

```cmd
npm install --save-dev @reportportal/agent-js-playwright
```

## Configuration

**1.** Create `playwright.config.ts` or `*.config.js` file with ReportPoral configuration:

```typescript
import { PlaywrightTestConfig } from '@playwright/test';

const rpConfig = {
  apiKey: '<API_KEY>',
  endpoint: 'https://your.reportportal.server/api/v2',
  project: 'Your reportportal project name',
  launch: 'Your launch name',
  attributes: [
    {
      key: 'key',
      value: 'value',
    },
    {
      value: 'value',
    },
  ],
  description: 'Your launch description',
};

const config: PlaywrightTestConfig = {
  reporter: [['@reportportal/agent-js-playwright', rpConfig]],
  testDir: './tests',
};
export default config;
```

The full list of available options presented below.

### Authentication Options

The agent supports two authentication methods:
1. **API Key Authentication** (default)
2. **OAuth 2.0 Password Grant** (recommended for enhanced security)

**Note:**\
If both authentication methods are provided, OAuth 2.0 will be used.\
Either API key or complete OAuth 2.0 configuration is required to connect to ReportPortal.

| Option | Necessity   | Default | Description                                                                                                                                                    |
|--------|-------------|---------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| apiKey | Conditional |         | User's ReportPortal API key from which you want to send requests. It can be found on the profile page of this user. *Required only if OAuth is not configured. |
| oauth  | Conditional |         | OAuth 2.0 configuration object. When provided, OAuth authentication will be used instead of API key. See OAuth Configuration below.                            |

#### OAuth Configuration

The `oauth` object supports the following properties:

| Property              | Necessity  | Default  | Description                                                                                                                                                                                                                                                                                                                     |
|-----------------------|------------|----------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| tokenEndpoint         | Required   |          | OAuth 2.0 token endpoint URL for password grant flow.                                                                                                                                                                                                                                                                           |
| username              | Required   |          | Username for OAuth 2.0 password grant.                                                                                                                                                                                                                                                                                          |
| password              | Required   |          | Password for OAuth 2.0 password grant.                                                                                                                                                                                                                                                                                          |
| clientId              | Required   |          | OAuth 2.0 client ID.                                                                                                                                                                                                                                                                                                            |
| clientSecret          | Optional   |          | OAuth 2.0 client secret (optional, depending on your OAuth server configuration).                                                                                                                                                                                                                                               |
| scope                 | Optional   |          | OAuth 2.0 scope (optional, space-separated list of scopes).                                                                                                                                                                                                                                                                     |

**Note:** The OAuth interceptor automatically handles token refresh when the token is about to expire (1 minute before expiration).

##### OAuth 2.0 configuration example

```javascript
const rpConfig = {
  endpoint: 'https://your.reportportal.server/api/v2',
  project: 'Your reportportal project name',
  launch: 'Your launch name',
  oauth: {
    tokenEndpoint: 'https://your-oauth-server.com/oauth/token',
    username: 'your-username',
    password: 'your-password',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret', // optional
    scope: 'reportportal', // optional
  }
};
```

### General options

| Option                                      | Necessity  | Default   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------- | ---------- | --------- |------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| endpoint                                    | Required   |           | URL of your server. For example 'https://server:8080/api/v1'.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| launch                                      | Required   |           | Name of launch at creation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| project                                     | Required   |           | The name of the project in which the launches will be created.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| attributes                                  | Optional   | []        | Launch attributes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| description                                 | Optional   | ''        | Launch description.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| rerun                                       | Optional   | false     | Enable [rerun](https://reportportal.io/docs/dev-guides/RerunDevelopersGuide)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| rerunOf                                     | Optional   | Not set   | UUID of launch you want to rerun. If not specified, reportportal will update the latest launch with the same name                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| mode                                        | Optional   | 'DEFAULT' | Results will be submitted to Launches page <br/> _'DEBUG'_ - Results will be submitted to Debug page.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| skippedIssue                                | Optional   | true      | reportportal provides feature to mark skipped tests as not 'To Investigate'. <br/> Option could be equal boolean values: <br/> _true_ - skipped tests considered as issues and will be marked as 'To Investigate' on reportportal. <br/> _false_ - skipped tests will not be marked as 'To Investigate' on application.                                                                                                                                                                                                                                                                                                                                                                                                            |
| debug                                       | Optional   | false     | This flag allows seeing the logs of the client-javascript. Useful for debugging.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| launchId                                    | Optional   | Not set   | The _ID_ of an already existing launch. The launch must be in 'IN*PROGRESS' status while the tests are running. Please note that if this \_ID* is provided, the launch will not be finished at the end of the run and must be finished separately.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| restClientConfig                            | Optional   | Not set   | `axios` like http client [config](https://github.com/axios/axios#request-config). May contain `agent` property for configure [http(s)](https://nodejs.org/api/https.html#https_https_request_url_options_callback) client, and other client options e.g. `proxy`, [`timeout`](https://github.com/reportportal/client-javascript#timeout-30000ms-on-axios-requests). For debugging and displaying logs the `debug: true` option can be used. Use the retry property (number or axios-retry config) to customise [automatic retries](https://github.com/reportportal/client-javascript?tab=readme-ov-file#retry-configuration). <br/> Visit [client-javascript](https://github.com/reportportal/client-javascript) for more details. |
| headers                                     | Optional   | {}        | The object with custom headers for internal http client.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| launchUuidPrint                             | Optional   | false     | Whether to print the current launch UUID.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| launchUuidPrintOutput                       | Optional   | 'STDOUT'  | Launch UUID printing output. Possible values: 'STDOUT', 'STDERR', 'FILE', 'ENVIRONMENT'. Works only if `launchUuidPrint` set to `true`. File format: `rp-launch-uuid-${launch_uuid}.tmp`. Env variable: `RP_LAUNCH_UUID`, note that the env variable is only available in the reporter process (it cannot be obtained from tests).                                                                                                                                                                                                                                                                                                                                                                                                 |
| includeTestSteps                            | Optional   | false     | Allows you to see the test steps at the log level.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| includePlaywrightProjectNameToCodeReference | Optional   | false     | Includes Playwright project name to code reference. See [`testCaseId and codeRef calculation`](#setTestCaseId). It may be useful when you want to see the different history for the same test cases within different playwright projects.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| extendTestDescriptionWithLastError          | Optional   | true      | If set to `true` the latest error log will be attached to the test case description.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| uploadVideo                                 | Optional   | true      | Whether to attach the Playwright's [video](https://playwright.dev/docs/api/class-testoptions#test-options-video) to the test case.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| uploadTrace                                 | Optional   | true      | Whether to attach the Playwright's [trace](https://playwright.dev/docs/api/class-testoptions#test-options-trace) to the test case.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| token                                       | Deprecated | Not set   | Use `apiKey` or `oauth` instead.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

The following options can be overridden using ENVIRONMENT variables:

| Option   | ENV variable |
| -------- | ------------ |
| launchId | RP_LAUNCH_ID |

**2.** Add script to `package.json` file:

```json
{
  "scripts": {
    "test": "npx playwright test --config=playwright.config.ts"
  }
}
```

## Asynchronous API

The client supports an asynchronous reporting (via the ReportPortal asynchronous API).
If you want the client to report through the asynchronous API, change `v1` to `v2` in the `endpoint` address.

**Note:** It is highly recommended to use the `v2` endpoint for reporting, especially for extensive test suites.

## Reporting

When organizing tests, specify titles for `test.describe` blocks, as this is necessary to build the correct structure of reports.

It is also required to specify playwright project names in `playwright.config.ts` when running the same tests in different playwright projects.

### Attachments

Attachments can be easily added during test run via `testInfo.attach` according to the Playwright [docs](https://playwright.dev/docs/api/class-testinfo#test-info-attach).

```typescript
import { test, expect } from '@playwright/test';

test('basic test', async ({ page }, testInfo) => {
  await page.goto('https://playwright.dev');

  // Capture a screenshot and attach it
  const screenshot = await page.screenshot();
  await testInfo.attach('screenshot', { body: screenshot, contentType: 'image/png' });
});
```

**Note:** attachment path can be provided instead of body.

As an alternative to this approach the [`ReportingAPI`](#log) methods can be used.

**Note:** [`ReportingAPI`](#log) methods will send attachments to ReportPortal right after their call, unlike attachments provided via `testInfo.attach` that will be reported only on the test item finish.

### Logging

You can use the following `console` native methods to report logs to tests:

```typescript
console.log();
console.info();
console.debug();
console.warn();
console.error();
```

console's `log`, `info`,`dubug` reports as info log.

console's `error`, `warn` reports as error log if message contains "error" mention, otherwise as warn log.

As an alternative to this approach the [`ReportingAPI`](#log) methods can be used.

### Nested steps

ReportPortal supports reportings of native [Playwright steps](https://playwright.dev/docs/api/class-test#test-step) as nested steps.

```typescript
import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await test.step('Log in', async () => {
    // ...
  });

  await test.step('Outer step', async () => {
    // ...
    // You can nest steps inside each other.
    await test.step('Inner step', async () => {
      // ...
    });
  });
});
```

To turn on this feature, just set the `includeTestSteps` config options to `true`.

### Reporting API

This reporter provides Reporting API to use it directly in tests to send some additional data to the report.

To start using the `ReportingApi` in tests, just import it from `'@reportportal/agent-js-playwright'`:

```javascript
import { ReportingApi } from '@reportportal/agent-js-playwright';
```

#### Reporting API methods

The API provide methods for attaching data (logs, attributes, testCaseId, status).<br/>
All ReportingApi methods have an optional _suite_ parameter.<br/>
If you want to add a data to the suite, you must pass the suite name as the last parameter.

##### addAttributes

Add attributes (tags) to the current test. Should be called inside of corresponding test.<br/>
`ReportingApi.addAttributes(attributes: Array<Attribute>, suite?: string);`<br/>
**required**: `attributes`<br/>
**optional**: `suite`<br/>
Example:

```javascript
test('should have the correct attributes', () => {
  ReportingApi.addAttributes([
    {
      key: 'testKey',
      value: 'testValue',
    },
    {
      value: 'testValueTwo',
    },
  ]);
  expect(true).toBe(true);
});
```

##### setTestCaseId

Set test case id to the current test ([About test case id](https://reportportal.io/docs/Test-case-ID%3Ewhat-is-it-test-case-id)). Should be called inside of corresponding test.<br/>
`ReportingApi.setTestCaseId(id: string, suite?: string);`<br/>
**required**: `id`<br/>
**optional**: `suite`<br/>
If `testCaseId` not specified, it will be generated automatically based on [codeRef](https://reportportal.io/docs/Test-case-ID%3Ewhat-does-happen-if-you-do-not-report-items-with-test-case-id-).<br/>
Example:

```javascript
test('should have the correct testCaseId', () => {
  ReportingApi.setTestCaseId('itemTestCaseId');
  expect(true).toBe(true);
});
```

##### log

Send logs to report portal for the current test. Should be called inside of corresponding test.<br/>
`ReportingApi.log(level: LOG_LEVELS, message: string, file?: Attachment, suite?: string);`<br/>
**required**: `level`, `message`<br/>
**optional**: `file`, `suite`<br/>
where `level` can be one of the following: _TRACE_, _DEBUG_, _WARN_, _INFO_, _ERROR_, _FATAL_<br/>
Example:

```javascript
test('should contain logs with attachments', () => {
  const fileName = 'test.jpg';
  const fileContent = fs.readFileSync(path.resolve(__dirname, './attachments', fileName));
  const attachment = {
    name: fileName,
    type: 'image/jpg',
    content: fileContent.toString('base64'),
  };
  ReportingApi.log('INFO', 'info log with attachment', attachment);

  expect(true).toBe(true);
});
```

##### info, debug, warn, error, trace, fatal

Send logs with corresponding level to report portal for the current test. Should be called inside of corresponding test.<br/>
`ReportingApi.info(message: string, file?: Attachment, suite?: string);`<br/>
`ReportingApi.debug(message: string, file?: Attachment, suite?: string);`<br/>
`ReportingApi.warn(message: string, file?: Attachment, suite?: string);`<br/>
`ReportingApi.error(message: string, file?: Attachment, suite?: string);`<br/>
`ReportingApi.trace(message: string, file?: Attachment, suite?: string);`<br/>
`ReportingApi.fatal(message: string, file?: Attachment, suite?: string);`<br/>
**required**: `message`<br/>
**optional**: `file`, `suite`<br/>
Example:

```javascript
test('should contain logs with attachments', () => {
  ReportingApi.info('Log message');
  ReportingApi.debug('Log message');
  ReportingApi.warn('Log message');
  ReportingApi.error('Log message');
  ReportingApi.trace('Log message');
  ReportingApi.fatal('Log message');

  expect(true).toBe(true);
});
```

##### launchLog

Send logs to report portal for the current launch. Should be called inside of the any test or suite.<br/>
`ReportingApi.launchLog(level: LOG_LEVELS, message: string, file?: Attachment);`<br/>
**required**: `level`, `message`<br/>
**optional**: `file`<br/>
where `level` can be one of the following: _TRACE_, _DEBUG_, _WARN_, _INFO_, _ERROR_, _FATAL_<br/>
Example:

```javascript
test('should contain logs with attachments', async () => {
  const fileName = 'test.jpg';
  const fileContent = fs.readFileSync(path.resolve(__dirname, './attachments', fileName));
  const attachment = {
    name: fileName,
    type: 'image/jpg',
    content: fileContent.toString('base64'),
  };
  ReportingApi.launchLog('INFO', 'info log with attachment', attachment);

  await expect(true).toBe(true);
});
```

##### launchInfo, launchDebug, launchWarn, launchError, launchTrace, launchFatal

Send logs with corresponding level to report portal for the current launch. Should be called inside of the any test or suite.<br/>
`ReportingApi.launchInfo(message: string, file?: Attachment);`<br/>
`ReportingApi.launchDebug(message: string, file?: Attachment);`<br/>
`ReportingApi.launchWarn(message: string, file?: Attachment);`<br/>
`ReportingApi.launchError(message: string, file?: Attachment);`<br/>
`ReportingApi.launchTrace(message: string, file?: Attachment);`<br/>
`ReportingApi.launchFatal(message: string, file?: Attachment);`<br/>
**required**: `message`<br/>
**optional**: `file`<br/>
Example:

```javascript
test('should contain logs with attachments', () => {
  ReportingApi.launchInfo('Log message');
  ReportingApi.launchDebug('Log message');
  ReportingApi.launchWarn('Log message');
  ReportingApi.launchError('Log message');
  ReportingApi.launchTrace('Log message');
  ReportingApi.launchFatal('Log message');

  expect(true).toBe(true);
});
```

##### setStatus

Assign corresponding status to the current test item. Should be called inside of corresponding test.<br/>
`ReportingApi.setStatus(status: string, suite?: string);`<br/>
**required**: `status`<br/>
**optional**: `suite`<br/>
where `status` must be one of the following: _passed_, _failed_, _stopped_, _skipped_, _interrupted_, _cancelled_<br/>
Example:

```javascript
test('should have status FAILED', () => {
  ReportingApi.setStatus('failed');

  expect(true).toBe(true);
});
```

##### setStatusFailed, setStatusPassed, setStatusSkipped, setStatusStopped, setStatusInterrupted, setStatusCancelled

Assign corresponding status to the current test item. Should be called inside of corresponding test.<br/>
`ReportingApi.setStatusFailed(suite?: string);`<br/>
`ReportingApi.setStatusPassed(suite?: string);`<br/>
`ReportingApi.setStatusSkipped(suite?: string);`<br/>
`ReportingApi.setStatusStopped(suite?: string);`<br/>
`ReportingApi.setStatusInterrupted(suite?: string);`<br/>
`ReportingApi.setStatusCancelled(suite?: string);`<br/>
**optional**: `suite`<br/>
Example:

```javascript
test('should call ReportingApi to set statuses', () => {
  ReportingAPI.setStatusFailed();
  ReportingAPI.setStatusPassed();
  ReportingAPI.setStatusSkipped();
  ReportingAPI.setStatusStopped();
  ReportingAPI.setStatusInterrupted();
  ReportingAPI.setStatusCancelled();
});
```

##### setLaunchStatus

Assign corresponding status to the current launch. Should be called inside of the any test or suite.<br/>
`ReportingApi.setLaunchStatus(status: string);`<br/>
**required**: `status`<br/>
where `status` must be one of the following: _passed_, _failed_, _stopped_, _skipped_, _interrupted_, _cancelled_<br/>
Example:

```javascript
test('launch should have status FAILED', () => {
  ReportingApi.setLaunchStatus('failed');
  expect(true).toBe(true);
});
```

##### setLaunchStatusFailed, setLaunchStatusPassed, setLaunchStatusSkipped, setLaunchStatusStopped, setLaunchStatusInterrupted, setLaunchStatusCancelled

Assign corresponding status to the current test item. Should be called inside of the any test or suite.<br/>
`ReportingApi.setLaunchStatusFailed();`<br/>
`ReportingApi.setLaunchStatusPassed();`<br/>
`ReportingApi.setLaunchStatusSkipped();`<br/>
`ReportingApi.setLaunchStatusStopped();`<br/>
`ReportingApi.setLaunchStatusInterrupted();`<br/>
`ReportingApi.setLaunchStatusCancelled();`<br/>
Example:

```javascript
test('should call ReportingApi to set launch statuses', () => {
  ReportingAPI.setLaunchStatusFailed();
  ReportingAPI.setLaunchStatusPassed();
  ReportingAPI.setLaunchStatusSkipped();
  ReportingAPI.setLaunchStatusStopped();
  ReportingAPI.setLaunchStatusInterrupted();
  ReportingAPI.setLaunchStatusCancelled();
});
```

### Integration with Sauce Labs

To integrate with Sauce Labs just add attributes for the test case:

```javascript
[
  {
    key: 'SLID',
    value: '# of the job in Sauce Labs',
  },
  {
    key: 'SLDC',
    value: 'EU (your job region in Sauce Labs)',
  },
];
```

Example available in [examples repo](https://github.com/reportportal/examples-js/tree/main/example-playwright#run-in-saucelabs).

## Usage with sharded tests

Playwright supports [test sharding](https://playwright.dev/docs/test-sharding) on multiple machines.
It has its own CLI for merging reports from [multiple shards](https://playwright.dev/docs/test-sharding#merging-reports-from-multiple-shards).
But the mentioned CLI tool `merge-reports` is designed to merge local reports represented by files in the file system, so it is not suitable for external reporting systems like ReportPortal, as it requires at least network communication through the right endpoints.

Thus, in order to have a single launch in ReportPortal for sharded tests, additional customization is required.
There are several options to achieve this:

- [Using the `launchId` config option](#using-the-launchid-config-option)
- [Merging launches based on the build ID](#merging-launches-based-on-the-build-id)

**Note:** The [`@reportportal/client-javascript`](https://github.com/reportportal/client-javascript) SDK used here as a reference, but of course the same actions can be performed by sending requests to the ReportPortal API directly.

### Using the `launchId` config option

The complete example of `launchId` usage with shards can be found for our [playwright example](https://github.com/reportportal/examples-js/tree/main/example-playwright) with [GitHub Actions pipeline](https://github.com/reportportal/examples-js/blob/main/.github/workflows/CI-pipeline.yml), so you can use it as a reference while following this guide.

The agent supports the `launchId` parameter to specify the ID of the already started launch.
This way, you can start the launch using `@reportportal/client-javascript` before the test run and then specify its ID in the config or via environment variable.

1. Trigger a launch before all tests.

The `@reportportal/client-javascript` `startLaunch` method can be used.

```javascript
/*
 * startLaunch.js
 * */
const rpClient = require('@reportportal/client-javascript');

const rpConfig = {
  // ...
};

async function startLaunch() {
  const client = new rpClient(rpConfig);
  // see https://github.com/reportportal/client-javascript?tab=readme-ov-file#startlaunch for the details
  const response = await client.startLaunch({
    name: rpConfig.launch,
    attributes: rpConfig.attributes,
    // etc.
  }).promise;

  return response.id;
}

const launchId = await startLaunch();
```

Received `launchId` can be exported e.g. as an environment variable to your CI job.

2. Specify the launch ID for each job.
   This step depends on your CI provider and the available ways to path some values to the Node.js process.
   The launch ID can be set directly to the [reporter config](https://github.com/reportportal/agent-js-playwright#:~:text=Useful%20for%20debugging.-,launchId,-Optional).

```javascript
/*
 * playwright.config.js
 * */
const rpConfig = {
  // ...
  launchId: 'receivedLaunchId',
};
```

or just set as `RP_LAUNCH_ID` environment variable.

With launch ID provided, the agent will attach all test results to that launch.
So it won't be finished by the agent and should be finished separately.

3. As a run post-step (when all tests finished), launch also needs to be finished separately.

The `@reportportal/client-javascript` `finishLaunch` method can be used.

```javascript
/*
 * finishLaunch.js
 * */
const RPClient = require('@reportportal/client-javascript');

const rpConfig = {
  // ...
};

const finishLaunch = async () => {
  const client = new RPClient(rpConfig);
  const launchTempId = client.startLaunch({ id: process.env.RP_LAUNCH_ID }).tempId;
  // see https://github.com/reportportal/client-javascript?tab=readme-ov-file#finishlaunch for the details
  await client.finishLaunch(launchTempId, {}).promise;
};

await finishLaunch();
```

### Merging launches based on the build ID

This approach offers a way to merge several launches reported from different shards into one launch after the entire test execution completed and launches are finished.

- With this option the Auto-analysis, Pattern-analysis and Quality Gates will be triggered for each sharded launch individually.
- The launch numbering will be changed as each sharded launch will have its own number.
- The merged launch will be treated as a new launch with its own number.

This approach is equal to merging launches via [ReportPortal UI](https://reportportal.io/docs/work-with-reports/OperationsUnderLaunches/#merge-launches).

1. Specify a unique CI build ID as a launch attribute, which will be the same for different jobs in the same run (this could be a commit hash or something else).
   This step depends on your CI provider and the available ways to path some values to the Node.js process.

```javascript
/*
 * playwright.config.js
 * */
const rpConfig = {
  // ...
  attributes: [
    {
      key: 'CI_BUILD_ID',
      // e.g.
      value: process.env.GITHUB_COMMIT_SHA,
    },
  ],
};
```

2. Collect the launch IDs and call the merge operation.

The ReportPortal API can be used to filter the required launches by the provided attribute to collect their IDs.

```javascript
/*
 * mergeRpLaunches.js
 * */
const rpClient = require('@reportportal/client-javascript');

const rpConfig = {
  // ...
};

const client = new rpClient(rpConfig);

async function mergeLaunches() {
  const ciBuildId = process.env.CI_BUILD_ID;
  if (!ciBuildId) {
    console.error('To merge multiple launches, CI_BUILD_ID must not be empty');
    return;
  }
  try {
    // 1. Send request to get all launches with the same CI_BUILD_ID attribute value
    const params = new URLSearchParams({
      'filter.has.attributeValue': ciBuildId,
    });
    const launchSearchUrl = `launch?${params.toString()}`;
    const response = await client.restClient.retrieveSyncAPI(launchSearchUrl);
    // 2. Filter them to find launches that are in progress
    const launchesInProgress = response.content.filter((launch) => launch.status === 'IN_PROGRESS');
    // 3. If exists, just return. The steps can be repeated in some interval if needed
    if (launchesInProgress.length) {
      return;
    }
    // 4. If not, merge all found launches with the same CI_BUILD_ID attribute value
    const launchIds = response.content.map((launch) => launch.id);
    const request = client.getMergeLaunchesRequest(launchIds);
    request.description = rpConfig.description;
    request.extendSuitesDescription = false;
    const mergeURL = 'launch/merge';
    await client.restClient.create(mergeURL, request);
  } catch (err) {
    console.error('Fail to merge launches', err);
  }
}

mergeLaunches();
```

Using a merge operation for huge launches can increase the load on ReportPortal's API.
See the details and other parameters available for merge operation in [ReportPortal API docs](https://developers.reportportal.io/api-docs/service-api/versions/5.13/merge-launches-old-uuid-2).

**Note:** Since the options described require additional effort, the ReportPortal team intends to create a CLI for them to make them easier to use, but with no ETA.
Progress can be tracked in this [issue](https://github.com/reportportal/client-javascript/issues/218).

## Issues troubleshooting

### Launches stuck in progress on RP side

There is known issue that in some cases launches not finished as expected in ReportPortal while using static annotations (`.skip()`, `.fixme()`) that expect the test to be 'SKIPPED'.<br/>
This may happen in case of error thrown from `before`/`beforeAll` hooks, retries enabled and `fullyParallel: false`. Associated with [#85](https://github.com/reportportal/agent-js-playwright/issues/85).<br/>
In this case as a workaround we suggest to use `.skip()` and `.fixme()` annotations inside the test body:

use

```javascript
test('example fail', async ({}) => {
  test.fixme();
  expect(1).toBeGreaterThan(2);
});
```

instead of

```javascript
test.fixme('example fail', async ({}) => {
  expect(1).toBeGreaterThan(2);
});
```
