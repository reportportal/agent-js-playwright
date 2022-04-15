/*
 *  Copyright 2021 EPAM Systems
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import { TestCase, TestResult } from '@playwright/test/reporter';
import path from 'path';

import { LOG_LEVELS } from '../../constants';
import { RPReporter } from '../../reporter';
import { mockConfig } from '../mocks/configMock';
import { RPClientMock, tempLaunchId } from '../mocks/RPClientMock';

describe('logs reporting', () => {
  const playwrightProjectName = 'projectName';
  const suiteName = 'suiteName';
  const reporter = new RPReporter(mockConfig);
  const file = {
    name: 'filename',
    type: 'image/png',
    content: Buffer.from([1, 2, 3, 4, 5, 6, 7]).toString('base64'),
  };
  const log = {
    level: LOG_LEVELS.INFO,
    message: 'info log',
    file,
  };

  beforeAll(() => {
    reporter.client = RPClientMock;

    jest.clearAllMocks();
    jest.spyOn(reporter.client, 'sendLog');
  });

  describe('send log', () => {
    test('should send custom log for test item with params', () => {
      const currentTest = {
        title: 'test',
        tempId: 'testItemId',
      };
      const expectedSendLogObj = {
        time: reporter.client.helpers.now(),
        level: LOG_LEVELS.INFO,
        message: 'info log',
      };

      reporter.sendLog(currentTest.tempId, log);

      expect(reporter.client.sendLog).toHaveBeenCalledWith('testItemId', expectedSendLogObj, file);
    });

    test('should send log for launch with params', () => {
      reporter.launchId = 'tempLaunchId';
      const expectedSendLogObj = {
        time: reporter.client.helpers.now(),
        level: LOG_LEVELS.INFO,
        message: 'info log',
      };

      reporter.sendLaunchLog(log);

      expect(reporter.client.sendLog).toHaveBeenCalledWith(
        'tempLaunchId',
        expectedSendLogObj,
        file,
      );
    });

    test('suitesInfo should be updated with logs', () => {
      reporter.suites = new Map([[tempLaunchId, { id: tempLaunchId, name: 'suiteName' }]]);
      const testParams = {
        title: 'testName',
      } as TestCase;
      const expectedSuitesInfo = new Map([[tempLaunchId, { logs: [log] }]]);

      reporter.sendTestItemLog(log, testParams, tempLaunchId);

      expect(reporter.suitesInfo).toEqual(expectedSuitesInfo);
    });

    test('should send a log when the test item failed', async () => {
      reporter.suites = new Map([
        [
          playwrightProjectName,
          {
            id: tempLaunchId,
            name: playwrightProjectName,
            testsLength: 0,
            rootSuite: playwrightProjectName,
            rootSuiteLength: 1,
          },
        ],
        [
          `${playwrightProjectName}/${suiteName}`,
          { id: 'suiteId', name: suiteName, testsLength: 1, rootSuite: playwrightProjectName },
        ],
      ]);
      reporter.testItems = new Map([
        [tempLaunchId, { id: tempLaunchId, name: 'test', playwrightProjectName }],
      ]);
      const testParams = {
        title: 'test',
        parent: {
          title: playwrightProjectName,
          project: () => ({ name: playwrightProjectName }),
        },
        location: {
          file: `C:${path.sep}testProject${path.sep}tests${path.sep}example.js`,
          line: 5,
          column: 3,
        },
        titlePath: () => [
          '',
          playwrightProjectName,
          'tests/example.js',
          'rootDescribe',
          'parentDescribe',
          'testTitle',
        ],
      } as TestCase;

      const result = {
        status: 'failed',
        error: {
          message: 'message',
          stack: 'stack',
        },
      } as TestResult;
      jest.spyOn(reporter, 'sendLog');

      await reporter.onTestEnd(testParams, result);

      expect(reporter.sendLog).toHaveBeenCalledWith(tempLaunchId, {
        level: LOG_LEVELS.ERROR,
        message: result.error.stack,
      });
    });
  });
});
