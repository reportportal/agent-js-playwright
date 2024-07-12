# @reportportal/agent-js-playwright

Agent to integrate Playwright with ReportPortal.
* More about [Playwright](https://playwright.dev/)
* More about [ReportPortal](http://reportportal.io/)

## Installation
Install the agent in your project:
```cmd
npm install --save-dev @reportportal/agent-js-playwright
```

## Configuration

**1.** Create `playwright.config.ts` or `*.config.js` file with reportportal configuration:
```typescript
  import { PlaywrightTestConfig } from '@playwright/test';

  const RPconfig = {
    apiKey: '<API_KEY>',
    endpoint: 'https://your.reportportal.server/api/v1',
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
    reporter: [['@reportportal/agent-js-playwright', RPconfig]],
    testDir: './tests',
  };
  export default config;
```

The full list of available options presented below.

| Option                                      | Necessity  | Default   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
|---------------------------------------------|------------|-----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| apiKey                                      | Required   |           | User's reportportal token from which you want to send requests. It can be found on the profile page of this user.                                                                                                                                                                                                                                                                                                                                                                                                                                |
| endpoint                                    | Required   |           | URL of your server. For example 'https://server:8080/api/v1'.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| launch                                      | Required   |           | Name of launch at creation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| project                                     | Required   |           | The name of the project in which the launches will be created.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| attributes                                  | Optional   | []        | Launch attributes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| description                                 | Optional   | ''        | Launch description.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| rerun                                       | Optional   | false     | Enable [rerun](https://reportportal.io/docs/dev-guides/RerunDevelopersGuide)                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| rerunOf                                     | Optional   | Not set   | UUID of launch you want to rerun. If not specified, reportportal will update the latest launch with the same name                                                                                                                                                                                                                                                                                                                                                                                                                                |
| mode                                        | Optional   | 'DEFAULT' | Results will be submitted to Launches page <br/> *'DEBUG'* - Results will be submitted to Debug page.                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| skippedIssue                                | Optional   | true      | reportportal provides feature to mark skipped tests as not 'To Investigate'. <br/> Option could be equal boolean values: <br/> *true* - skipped tests considered as issues and will be marked as 'To Investigate' on reportportal. <br/> *false* - skipped tests will not be marked as 'To Investigate' on application.                                                                                                                                                                                                                          |
| debug                                       | Optional   | false     | This flag allows seeing the logs of the client-javascript. Useful for debugging.                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| launchId                                    | Optional   | Not set   | The _ID_ of an already existing launch. The launch must be in 'IN_PROGRESS' status while the tests are running. Please note that if this _ID_ is provided, the launch will not be finished at the end of the run and must be finished separately.                                                                                                                                                                                                                                                                                                |                            
| restClientConfig                            | Optional   | Not set   | `axios` like http client [config](https://github.com/axios/axios#request-config). May contain `agent` property for configure [http(s)](https://nodejs.org/api/https.html#https_https_request_url_options_callback) client, and other client options e.g. `proxy`, [`timeout`](https://github.com/reportportal/client-javascript#timeout-30000ms-on-axios-requests). For debugging and displaying logs the `debug: true` option can be used. <br/> Visit [client-javascript](https://github.com/reportportal/client-javascript) for more details. |
| headers                                     | Optional   | {}        | The object with custom headers for internal http client.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| launchUuidPrint                             | Optional   | false     | Whether to print the current launch UUID.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| launchUuidPrintOutput                       | Optional   | 'STDOUT'  | Launch UUID printing output. Possible values: 'STDOUT', 'STDERR', 'FILE', 'ENVIRONMENT'. Works only if `launchUuidPrint` set to `true`. File format: `rp-launch-uuid-${launch_uuid}.tmp`. Env variable: `RP_LAUNCH_UUID`, note that the env variable is only available in the reporter process (it cannot be obtained from tests).                                                                                                                                                                                                                                                                                                                       |
| includeTestSteps                            | Optional   | false     | Allows you to see the test steps at the log level.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| includePlaywrightProjectNameToCodeReference | Optional   | false     | Includes Playwright project name to code reference. See [`testCaseId and codeRef calculation`](#setTestCaseId). It may be useful when you want to see the different history for the same test cases within different playwright projects.                                                                                                                                                                                                                                                                                                        |
| extendTestDescriptionWithLastError          | Optional   | true      | If set to `true` the latest error log will be attached to the test case description.                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| uploadVideo                                 | Optional   | true      | Whether to attach the Playwright's [video](https://playwright.dev/docs/api/class-testoptions#test-options-video) to the test case.                                                                                                                                                                                                                                                                                                                                                                                                               |
| uploadTrace                                 | Optional   | true      | Whether to attach the Playwright's [trace](https://playwright.dev/docs/api/class-testoptions#test-options-trace) to the test case.                                                                                                                                                                                                                                                                                                                                                                                                               |
| token                                       | Deprecated | Not set   | Use `apiKey` instead.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

The following options can be overridden using ENVIRONMENT variables:

| Option      | ENV variable    |
|-------------|-----------------|
| launchId    | RP_LAUNCH_ID    |

**2.** Add script to `package.json` file:
```json
{
  "scripts": {
    "test": "npx playwright test --config=playwright.config.ts"
  }
}
```

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

*Note:* attachment path can be provided instead of body.

As an alternative to this approach the [`ReportingAPI`](#log) methods can be used.

*Note:* [`ReportingAPI`](#log) methods will send attachments to ReportPortal right after their call, unlike attachments provided via `testInfo.attach` that will be reported only on the test item finish.

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
where `level` can be one of the following: *TRACE*, *DEBUG*, *WARN*, *INFO*, *ERROR*, *FATAL*<br/>
Example:
```javascript
test('should contain logs with attachments',() => {
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
where `level` can be one of the following: *TRACE*, *DEBUG*, *WARN*, *INFO*, *ERROR*, *FATAL*<br/>
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
where `status` must be one of the following: *passed*, *failed*, *stopped*, *skipped*, *interrupted*, *cancelled*<br/>
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
where `status` must be one of the following: *passed*, *failed*, *stopped*, *skipped*, *interrupted*, *cancelled*<br/>
Example:
```javascript
test('launch should have status FAILED',  () => {
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
[{
 "key": "SLID",
 "value": "# of the job in Sauce Labs"
}, {
 "key": "SLDC",
 "value": "EU (your job region in Sauce Labs)"
}]
```

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
