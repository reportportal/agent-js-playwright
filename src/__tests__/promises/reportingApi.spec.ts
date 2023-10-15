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
 *
 */

import { ReportingApi } from '../../promises';
import * as utils from '../../utils';
import { LOG_LEVELS } from '../../constants';

const reportingApiStatusMethods = [
  { method: 'setStatusPassed', status: 'passed' },
  { method: 'setStatusFailed', status: 'failed' },
  { method: 'setStatusSkipped', status: 'skipped' },
  { method: 'setStatusStopped', status: 'stopped' },
  { method: 'setStatusInterrupted', status: 'interrupted' },
  { method: 'setStatusCancelled', status: 'cancelled' },
  { method: 'setStatusInfo', status: 'info' },
  { method: 'setStatusWarn', status: 'warn' },
];

const reportingApiLaunchStatusMethods = [
  { method: 'setLaunchStatusPassed', status: 'passed' },
  { method: 'setLaunchStatusFailed', status: 'failed' },
  { method: 'setLaunchStatusSkipped', status: 'skipped' },
  { method: 'setLaunchStatusStopped', status: 'stopped' },
  { method: 'setLaunchStatusInterrupted', status: 'interrupted' },
  { method: 'setLaunchStatusCancelled', status: 'cancelled' },
  { method: 'setLaunchStatusInfo', status: 'info' },
  { method: 'setLaunchStatusWarn', status: 'warn' },
];

const reportingApiLogMethods = [
  { method: 'trace', level: 'TRACE' },
  { method: 'debug', level: 'DEBUG' },
  { method: 'info', level: 'INFO' },
  { method: 'warn', level: 'WARN' },
  { method: 'error', level: 'ERROR' },
  { method: 'fatal', level: 'FATAL' },
];

const reportingApiLaunchLogMethods = [
  { method: 'launchTrace', level: 'TRACE' },
  { method: 'launchDebug', level: 'DEBUG' },
  { method: 'launchInfo', level: 'INFO' },
  { method: 'launchWarn', level: 'WARN' },
  { method: 'launchError', level: 'ERROR' },
  { method: 'launchFatal', level: 'FATAL' },
];

describe('reportingApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('addAttributes should call sendEventToReporter with params', () => {
    const attrs = [
      {
        key: 'key',
        value: 'value',
      },
    ];
    const suite = 'suite';
    const spySendEventToReporter = jest.spyOn(utils, 'sendEventToReporter');
    ReportingApi.addAttributes(attrs, suite);

    expect(spySendEventToReporter).toHaveBeenCalledTimes(1);
  });

  test('setDescription should call sendEventToReporter with params', () => {
    const description = 'description';
    const suite = 'suite';
    const spySendEventToReporter = jest.spyOn(utils, 'sendEventToReporter');
    ReportingApi.setDescription(description, suite);

    expect(spySendEventToReporter).toHaveBeenCalledTimes(1);
  });

  test('setTestCaseId should call sendEventToReporter with params', () => {
    const testCaseId = 'TestCaseIdForTheSuite';
    const suite = 'suite';
    const spySendEventToReporter = jest.spyOn(utils, 'sendEventToReporter');
    ReportingApi.setTestCaseId(testCaseId, suite);

    expect(spySendEventToReporter).toHaveBeenCalledTimes(1);
  });

  describe('Item status reporting', () => {
    reportingApiStatusMethods.map(({ method, status }) => {
      test(`${method} should call sendEventToReporter with ${status} status`, () => {
        const suite = 'suite';
        const spySendEventToReporter = jest.spyOn(utils, 'sendEventToReporter');
        // @ts-ignore
        ReportingApi[method](suite);

        expect(spySendEventToReporter).toHaveBeenCalledTimes(1);
      });
    });

    test('ReportingApi.setStatus should call sendEventToReporter with provided status', () => {
      const suite = 'suite';
      const status = 'PASSED';
      const spySendEventToReporter = jest.spyOn(utils, 'sendEventToReporter');
      ReportingApi.setStatus(status, suite);

      expect(spySendEventToReporter).toHaveBeenCalledTimes(1);
    });
  });

  describe('Launch status reporting', () => {
    reportingApiLaunchStatusMethods.map(({ method, status }) => {
      test(`${method} should call sendEventToReporter with ${status} status`, () => {
        const spySendEventToReporter = jest.spyOn(utils, 'sendEventToReporter');
        // @ts-ignore
        ReportingApi[method]();

        expect(spySendEventToReporter).toHaveBeenCalledTimes(1);
      });
    });

    test('ReportingApi.setLaunchStatus should call sendEventToReporter with provided status', () => {
      const spySendEventToReporter = jest.spyOn(utils, 'sendEventToReporter');
      const status = 'PASSED';
      ReportingApi.setLaunchStatus(status);

      expect(spySendEventToReporter).toHaveBeenCalledTimes(1);
    });
  });

  describe('Logs reporting', () => {
    const file = {
      name: 'filename',
      type: 'image/png',
      content: Buffer.from([1, 2, 3, 4, 5, 6, 7]).toString('base64'),
    };
    const suite = 'suite';

    reportingApiLogMethods.map(({ method, level }) => {
      test(`${method} should call ReportingApi.log with ${level} level`, () => {
        const spyLogFunc = jest.spyOn(ReportingApi, 'log');

        // @ts-ignore
        ReportingApi[method]('message', file, suite);

        expect(spyLogFunc).toHaveBeenCalledTimes(1);
      });
    });

    test('ReportingApi.log should call sendEventToReporter with params', () => {
      const spySendEventToReporter = jest.spyOn(utils, 'sendEventToReporter');
      ReportingApi.log(LOG_LEVELS.INFO, 'message', file, suite);

      expect(spySendEventToReporter).toHaveBeenCalledTimes(1);
    });
  });

  describe('Launch logs reporting', () => {
    const file = {
      name: 'filename',
      type: 'image/png',
      content: Buffer.from([1, 2, 3, 4, 5, 6, 7]).toString('base64'),
    };

    reportingApiLaunchLogMethods.map(({ method, level }) => {
      test(`${method} should call ReportingApi.launchLog with ${level} level`, () => {
        const spyLogFunc = jest.spyOn(ReportingApi, 'launchLog');

        // @ts-ignore
        ReportingApi[method]('message', file);

        expect(spyLogFunc).toHaveBeenCalledTimes(1);
      });
    });

    test('ReportingApi.launchLog should call sendEventToReporter with params', () => {
      const spySendEventToReporter = jest.spyOn(utils, 'sendEventToReporter');
      ReportingApi.launchLog(LOG_LEVELS.INFO, 'message', file);

      expect(spySendEventToReporter).toHaveBeenCalledTimes(1);
    });
  });
});
