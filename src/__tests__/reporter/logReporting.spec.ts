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

import helpers from '@reportportal/client-javascript/lib/helpers';
import { RPReporter } from '../../reporter';
import { mockConfig } from '../mocks/configMock';
import { RPClientMock, mockedDate } from '../mocks/RPClientMock';
import { LOG_LEVELS } from '../../constants';

const playwrightProjectName = 'projectName';
const tempTestItemId = 'tempTestItemId';
const suiteName = 'suiteName';

describe('logs reporting', () => {
  jest.spyOn(helpers, 'now').mockReturnValue(mockedDate);

  const reporter = new RPReporter(mockConfig);
  reporter.client = new RPClientMock(mockConfig);

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

  describe('send log', () => {
    test('should send custom log for test item with params', () => {
      const spySendLog = jest.spyOn(reporter.client, 'sendLog');
      const currentTest = {
        title: 'test',
        tempId: 'testItemId',
      };
      const expectedSendLogObj = {
        time: mockedDate,
        level: LOG_LEVELS.INFO,
        message: 'info log',
      };

      reporter.sendLog(currentTest.tempId, log);

      expect(spySendLog).toHaveBeenCalledWith('testItemId', expectedSendLogObj, file);
    });

    test('should send log for launch with params', () => {
      reporter.launchId = 'tempLaunchId';
      const spySendLog = jest.spyOn(reporter.client, 'sendLog');

      const expectedSendLogObj = {
        time: mockedDate,
        level: LOG_LEVELS.INFO,
        message: 'info log',
      };

      reporter.sendLaunchLog(log);

      expect(spySendLog).toHaveBeenCalledWith('tempLaunchId', expectedSendLogObj, file);
    });

    test('suitesInfo should be updated with logs', () => {
      reporter.suites = new Map([[tempTestItemId, { id: tempTestItemId, name: 'suiteName' }]]);
      const testCase = {
        title: 'testName',
      };

      const expectedSuitesInfo = new Map([[tempTestItemId, { logs: [log] }]]);
      // @ts-ignore
      reporter.sendTestItemLog(log, testCase, tempTestItemId);

      expect(reporter.suitesInfo).toEqual(expectedSuitesInfo);
    });

    test('should send a log when the test item failed', async () => {
      reporter.suites = new Map([
        [
          playwrightProjectName,
          {
            id: 'rootSuiteId',
            name: playwrightProjectName,
            testCount: 1,
            descendants: [`${playwrightProjectName}/${suiteName}/testTitle`],
          },
        ],
        [
          `${playwrightProjectName}/${suiteName}`,
          {
            id: 'suiteId',
            name: suiteName,
            testCount: 1,
            descendants: [`${playwrightProjectName}/${suiteName}/testTitle`],
          },
        ],
      ]);
      reporter.testItems = new Map([['testItemId', { id: tempTestItemId, name: 'testTitle' }]]);
      const testCase = {
        title: 'testTitle',
        id: 'testItemId',
        results: [{ attachments: [{}] }],
        parent: {
          title: playwrightProjectName,
          location: 'tests/example.js',
          tests: ['testTitle'],
          project: () => ({ name: playwrightProjectName }),
          allTests: () => [
            {
              title: 'testTitle',
              id: 'testItemId',
              titlePath: () => ['', playwrightProjectName, suiteName, 'testTitle'],
            },
          ],
          parent: {
            title: suiteName,
            project: () => ({ name: playwrightProjectName }),
            allTests: () => [
              {
                title: 'testTitle',
                id: 'testItemId',
                titlePath: () => ['', playwrightProjectName, suiteName, 'testTitle'],
              },
            ],
          },
        },
        titlePath: () => ['', playwrightProjectName, suiteName, 'testTitle'],
        outcome: () => 'unexpected',
        annotations: [{ type: 'custom' }],
        _staticAnnotations: [{ type: 'custom' }],
      };

      const result = {
        status: 'failed',
        error: {
          message: 'message',
          stack: 'stack',
        },
      };
      jest.spyOn(reporter, 'sendLog');

      // @ts-ignore
      await reporter.onTestEnd(testCase, result);

      expect(reporter.sendLog).toHaveBeenCalledWith(tempTestItemId, {
        level: LOG_LEVELS.ERROR,
        message: result.error.stack,
      });
    });
  });
});
