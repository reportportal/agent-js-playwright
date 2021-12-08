# @reportportal/agent-js-playwright

Agent for integration Playwright with ReportPortal.
* More about [Playwright](https://playwright.dev/)
* More about [ReportPortal](http://reportportal.io/)

## Installation
Install the agent in your project:
```cmd
npm install --save-dev @reportportal/agent-js-playwright
```



## Configuration

**1.** Create `playwright.config.ts` file with reportportal configuration:
```typescript
  import { PlaywrightTestConfig } from '@playwright/test';

  const RPconfig = {
    'token': '00000000-0000-0000-0000-000000000000',
    'endpoint': 'https://your.reportportal.server/api/v1',
    'project': 'Your project',
    'launch': 'Playwright test',
    'attributes': [
      {
        'key': 'key',
        'value': 'value',
      },
      {
        'value': 'value',
      },
    ],
    'description': 'Your launch description',
  };

  const config: PlaywrightTestConfig = {
    reporter: [[require.resolve('@reportportal/agent-js-playwright'), RPconfig]],
    testDir: './tests',
  };
  export default config;
```

| Parameter             | Description                                                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- |
| token                 | User's Report Portal token from which you want to send requests. It can be found on the profile page of this user.|
| endpoint              | URL of your server. For example 'https://server:8080/api/v1'.                                                     |
| launch                | Name of launch at creation.                                                                                       |
| project               | The name of the project in which the launches will be created.                                                    |
| rerun                 | *Default: false.* Enable [rerun](https://github.com/reportportal/documentation/blob/master/src/md/src/DevGuides/rerun.md)|
| rerunOf               | UUID of launch you want to rerun. If not specified, report portal will update the latest launch with the same name|
| mode                  | Launch mode. Allowable values *DEFAULT* (by default) or *DEBUG*.|
| skippedIssue          | *Default: true.* ReportPortal provides feature to mark skipped tests as not 'To Investigate' items on WS side.<br> Parameter could be equal boolean values:<br> *TRUE* - skipped tests considered as issues and will be marked as 'To Investigate' on Report Portal.<br> *FALSE* - skipped tests will not be marked as 'To Investigate' on application.|
| debug                 | This flag allows seeing the logs of the client-javascript. Useful for debugging.|


**2.** Add script to `package.json` file:
```json
{
  "scripts": {
    "test": "npx playwright test --config=playwright.config.ts"
  }
}

```


## Reporting

This reporter provides Reporting API to use it directly in tests to send some additional data to the report.


To start using the `ReportingApi` in tests, just import it from `'@reportportal/agent-js-playwright'`:
```javascript
import { ReportingApi } from '@reportportal/agent-js-playwright/src/reportingApi';
```

#### Reporting API methods

The API provide methods for attaching data (logs, attributes, testCaseId, status).
All ReportingApi methods have an optional suite parameter.
If you want to add a data to the suite, you must pass the suite name as the last parameter


##### addAttributes
Add attributes(tags) to the current test. Should be called inside of corresponding test.<br/>
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
Set test case id to the current test. Should be called inside of corresponding test or fixture.<br/>
`ReportingApi.setTestCaseId(id: string, suite?: string);`<br/>
**required**: `id`<br/>
**optional**: `suite`<br/>
If `testCaseId` not specified, it will be generated automatically.<br/>
Example:
```javascript
test('should have the correct testCaseId', () => {
  ReportingApi.setTestCaseId('itemTestCaseId');
  expect(true).toBe(true);
});
```

##### log
Send logs to report portal for the current test. Should be called inside of corresponding test or fixture.<br/>
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
Send logs with corresponding level to report portal for the current test or for provided by name. Should be called inside of corresponding test or fixture.<br/>
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
Send logs to report portal for the current launch. Should be called inside of the any test or fixture.<br/>
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
Send logs with corresponding level to report portal for the current launch. Should be called inside of the any test or fixture.<br/>
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
Assign corresponding status to the current test item.<br/>
`ReportingApi.setStatus(status: string, suite?: string);`<br/>
**required**: `status`<br/>
**optional**: `suite`<br/>
where `status` must be one of the following: *passed*, *failed*, *stopped*, *skipped*, *interrupted*, *cancelled*, *info*, *warn*<br/>
Example:
```javascript
test('should have status FAILED', () => {
    ReportingApi.setStatus('failed');
    
    expect(true).toBe(true);
});
```

##### setStatusFailed, setStatusPassed, setStatusSkipped, setStatusStopped, setStatusInterrupted, setStatusCancelled, setStatusInfo, setStatusWarn
Assign corresponding status to the current test item.<br/>
`ReportingApi.setStatusFailed(suite?: string);`<br/>
`ReportingApi.setStatusPassed(suite?: string);`<br/>
`ReportingApi.setStatusSkipped(suite?: string);`<br/>
`ReportingApi.setStatusStopped(suite?: string);`<br/>
`ReportingApi.setStatusInterrupted(suite?: string);`<br/>
`ReportingApi.setStatusCancelled(suite?: string);`<br/>
`ReportingApi.setStatusInfo(suite?: string);`<br/>
`ReportingApi.setStatusWarn(suite?: string);`<br/>
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
    ReportingAPI.setStatusInfo();
    ReportingAPI.setStatusWarn();
});
```

##### setLaunchStatus
Assign corresponding status to the current launch.<br/>
`ReportingApi.setLaunchStatus(status: string);`<br/>
**required**: `status`<br/>
where `status` must be one of the following: *passed*, *failed*, *stopped*, *skipped*, *interrupted*, *cancelled*, *info*, *warn*<br/>
Example:
```javascript
test('launch should have status FAILED',  () => {
    ReportingApi.setLaunchStatus('failed');
    expect(true).toBe(true);
});
```

##### setLaunchStatusFailed, setLaunchStatusPassed, setLaunchStatusSkipped, setLaunchStatusStopped, setLaunchStatusInterrupted, setLaunchStatusCancelled, setLaunchStatusInfo, setLaunchStatusWarn
Assign corresponding status to the current test item.<br/>
`ReportingApi.setLaunchStatusFailed();`<br/>
`ReportingApi.setLaunchStatusPassed();`<br/>
`ReportingApi.setLaunchStatusSkipped();`<br/>
`ReportingApi.setLaunchStatusStopped();`<br/>
`ReportingApi.setLaunchStatusInterrupted();`<br/>
`ReportingApi.setLaunchStatusCancelled();`<br/>
`ReportingApi.setLaunchStatusInfo();`<br/>
`ReportingApi.setLaunchStatusWarn();`<br/>
Example:
```javascript
test('should call ReportingApi to set launch statuses', () => {
    ReportingAPI.setLaunchStatusFailed();
    ReportingAPI.setLaunchStatusPassed();
    ReportingAPI.setLaunchStatusSkipped();
    ReportingAPI.setLaunchStatusStopped();
    ReportingAPI.setLaunchStatusInterrupted();
    ReportingAPI.setLaunchStatusCancelled();
    ReportingAPI.setLaunchStatusInfo();
    ReportingAPI.setLaunchStatusWarn();
});
```

