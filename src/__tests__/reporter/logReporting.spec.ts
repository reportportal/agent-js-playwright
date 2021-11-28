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

import RPReporter from '../../reporter';
import { mockConfig } from '../mocks/configMock';
import { RPClientMock } from '../mocks/RPClientMock';
import { LOG_LEVELS } from '../../constants/logLevels';

describe('logs reporting', () => {
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
        time: reporter.client.helpers.now(),
        level: LOG_LEVELS.INFO,
        message: 'info log',
      };

      reporter.sendCustomLog(currentTest.tempId, log);

      expect(spySendLog).toHaveBeenCalledWith('testItemId', expectedSendLogObj, file);
    });

    test('should send log for launch with params', () => {
      reporter.launchId = 'tempLaunchId';
      const spySendLog = jest.spyOn(reporter.client, 'sendLog');

      const expectedSendLogObj = {
        time: reporter.client.helpers.now(),
        level: LOG_LEVELS.INFO,
        message: 'info log',
      };

      reporter.sendLaunchLog(log);

      expect(spySendLog).toHaveBeenCalledWith('tempLaunchId', expectedSendLogObj, file);
    });

    test('suitesInfo should be updated with logs', () => {
      reporter.suites = new Map([['tempTestItemId', { id: 'tempTestItemId', name: 'suiteName' }]]);
      const testParams = {
        title: 'testName',
      };

      const expectedSuitesInfo = new Map([['tempTestItemId', { logs: [log] }]]);
      // @ts-ignore
      reporter.sendTestItemLog(log, testParams, 'tempTestItemId');

      expect(reporter.suitesInfo).toEqual(expectedSuitesInfo);
    });

    test('should send a log when the test item failed', () => {
      reporter.testItems = new Map([['tempTestItemId', { id: 'tempTestItemId', name: 'test' }]]);
      const testParams = {
        title: 'test',
        parent: {
          title: 'suiteName',
        },
      };

      const result = {
        status: 'failed',
        error: {
          message: 'message',
          stack: 'stack',
        },
      };
      jest.spyOn(reporter, 'sendLogOnFail');

      // @ts-ignore
      reporter.onTestEnd(testParams, result);

      expect(reporter.sendLogOnFail).toHaveBeenCalledWith('tempTestItemId', result.error);
    });
  });
});