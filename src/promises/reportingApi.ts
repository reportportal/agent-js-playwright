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

import { EVENTS } from '@reportportal/client-javascript/lib/constants/events';
import { sendEventToReporter } from '../utils';
import { Attribute } from '../models';
import { STATUSES, LOG_LEVELS, RPTestInfo } from '../constants';
import { Attachment } from '../models/reporting';
import { test } from '@playwright/test';

export const ReportingApi = {
  addAttributes: (attrs: Attribute[], suite?: string): Promise<void> => {
    if (suite) {
      sendEventToReporter(EVENTS.ADD_ATTRIBUTES, attrs, suite);

      return Promise.resolve();
    }

    return test.info().attach(RPTestInfo.attributes, {
      body: JSON.stringify(attrs),
      contentType: 'application/json',
    });
  },

  setDescription: (description: string, suite?: string): Promise<void> => {
    if (suite) {
      sendEventToReporter(EVENTS.SET_DESCRIPTION, description, suite);

      return Promise.resolve();
    }

    return test.info().attach(RPTestInfo.description, {
      body: description,
      contentType: 'text/plain',
    });
  },
  setTestCaseId: (testCaseId: string, suite?: string): Promise<void> => {
    if (suite) {
      sendEventToReporter(EVENTS.SET_TEST_CASE_ID, testCaseId, suite);

      return Promise.resolve();
    }

    return test.info().attach(RPTestInfo.testCaseId, {
      body: testCaseId,
      contentType: 'text/plain',
    });
  },
  setStatus: (status: keyof typeof STATUSES, suite?: string): Promise<void> => {
    if (suite) {
      sendEventToReporter(EVENTS.SET_STATUS, status, suite);

      return Promise.resolve();
    }

    return test.info().attach(RPTestInfo.status, {
      body: status,
      contentType: 'text/plain',
    });
  },
  setStatusPassed: (suite?: string): Promise<void> => {
    if (suite) {
      sendEventToReporter(EVENTS.SET_STATUS, STATUSES.PASSED, suite);

      return Promise.resolve();
    }

    return test.info().attach(RPTestInfo.status, {
      body: STATUSES.PASSED,
      contentType: 'text/plain',
    });
  },
  setStatusFailed: (suite?: string): Promise<void> => {
    if (suite) {
      sendEventToReporter(EVENTS.SET_STATUS, STATUSES.FAILED, suite);

      return Promise.resolve();
    }

    return test
      .info()
      .attach(RPTestInfo.status, { body: STATUSES.FAILED, contentType: 'text/plain' });
  },
  setStatusSkipped: (suite?: string): Promise<void> => {
    if (suite) {
      sendEventToReporter(EVENTS.SET_STATUS, STATUSES.SKIPPED, suite);

      return Promise.resolve();
    }

    return test
      .info()
      .attach(RPTestInfo.status, { body: STATUSES.SKIPPED, contentType: 'text/plain' });
  },
  setStatusStopped: (suite?: string): Promise<void> => {
    if (suite) {
      sendEventToReporter(EVENTS.SET_STATUS, STATUSES.STOPPED, suite);

      return Promise.resolve();
    }

    return test
      .info()
      .attach(RPTestInfo.status, { body: STATUSES.STOPPED, contentType: 'text/plain' });
  },
  setStatusInterrupted: (suite?: string): Promise<void> => {
    if (suite) {
      sendEventToReporter(EVENTS.SET_STATUS, STATUSES.INTERRUPTED, suite);

      return Promise.resolve();
    }

    return test
      .info()
      .attach(RPTestInfo.status, { body: STATUSES.INTERRUPTED, contentType: 'text/plain' });
  },
  setStatusCancelled: (suite?: string): Promise<void> => {
    if (suite) {
      sendEventToReporter(EVENTS.SET_STATUS, STATUSES.CANCELLED, suite);

      return Promise.resolve();
    }

    return test
      .info()
      .attach(RPTestInfo.status, { body: STATUSES.CANCELLED, contentType: 'text/plain' });
  },
  setStatusInfo: (suite?: string): Promise<void> => {
    if (suite) {
      sendEventToReporter(EVENTS.SET_STATUS, STATUSES.INFO, suite);

      return Promise.resolve();
    }

    return test
      .info()
      .attach(RPTestInfo.status, { body: STATUSES.INFO, contentType: 'text/plain' });
  },
  setStatusWarn: (suite?: string): Promise<void> => {
    if (suite) {
      sendEventToReporter(EVENTS.SET_STATUS, STATUSES.WARN, suite);

      return Promise.resolve();
    }

    return test
      .info()
      .attach(RPTestInfo.status, { body: STATUSES.WARN, contentType: 'text/plain' });
  },

  setLaunchStatus: (status: keyof typeof STATUSES): void =>
    sendEventToReporter(EVENTS.SET_LAUNCH_STATUS, status),
  setLaunchStatusPassed: (): void => sendEventToReporter(EVENTS.SET_LAUNCH_STATUS, STATUSES.PASSED),
  setLaunchStatusFailed: (): void => sendEventToReporter(EVENTS.SET_LAUNCH_STATUS, STATUSES.FAILED),
  setLaunchStatusSkipped: (): void =>
    sendEventToReporter(EVENTS.SET_LAUNCH_STATUS, STATUSES.SKIPPED),
  setLaunchStatusStopped: (): void =>
    sendEventToReporter(EVENTS.SET_LAUNCH_STATUS, STATUSES.STOPPED),
  setLaunchStatusInterrupted: (): void =>
    sendEventToReporter(EVENTS.SET_LAUNCH_STATUS, STATUSES.INTERRUPTED),
  setLaunchStatusCancelled: (): void =>
    sendEventToReporter(EVENTS.SET_LAUNCH_STATUS, STATUSES.CANCELLED),
  setLaunchStatusInfo: (): void => sendEventToReporter(EVENTS.SET_LAUNCH_STATUS, STATUSES.INFO),
  setLaunchStatusWarn: (): void => sendEventToReporter(EVENTS.SET_LAUNCH_STATUS, STATUSES.WARN),

  log: (
    level: LOG_LEVELS = LOG_LEVELS.INFO,
    message = '',
    file?: Attachment,
    suite?: string,
  ): void => sendEventToReporter(EVENTS.ADD_LOG, { level, message, file }, suite),
  launchLog: (level: LOG_LEVELS = LOG_LEVELS.INFO, message = '', file?: Attachment): void =>
    sendEventToReporter(EVENTS.ADD_LAUNCH_LOG, { level, message, file }),
  trace: (message: string, file?: Attachment, suite?: string): void =>
    ReportingApi.log(LOG_LEVELS.TRACE, message, file, suite),
  debug: (message: string, file?: Attachment, suite?: string): void =>
    ReportingApi.log(LOG_LEVELS.DEBUG, message, file, suite),
  info: (message: string, file?: Attachment, suite?: string): void =>
    ReportingApi.log(LOG_LEVELS.INFO, message, file, suite),
  warn: (message: string, file?: Attachment, suite?: string): void =>
    ReportingApi.log(LOG_LEVELS.WARN, message, file, suite),
  error: (message: string, file?: Attachment, suite?: string): void =>
    ReportingApi.log(LOG_LEVELS.ERROR, message, file, suite),
  fatal: (message: string, file?: Attachment, suite?: string): void =>
    ReportingApi.log(LOG_LEVELS.FATAL, message, file, suite),
  launchTrace: (message: string, file?: Attachment): void =>
    ReportingApi.launchLog(LOG_LEVELS.TRACE, message, file),
  launchDebug: (message: string, file?: Attachment): void =>
    ReportingApi.launchLog(LOG_LEVELS.DEBUG, message, file),
  launchInfo: (message: string, file?: Attachment): void =>
    ReportingApi.launchLog(LOG_LEVELS.INFO, message, file),
  launchWarn: (message: string, file?: Attachment): void =>
    ReportingApi.launchLog(LOG_LEVELS.WARN, message, file),
  launchError: (message: string, file?: Attachment): void =>
    ReportingApi.launchLog(LOG_LEVELS.ERROR, message, file),
  launchFatal: (message: string, file?: Attachment): void =>
    ReportingApi.launchLog(LOG_LEVELS.FATAL, message, file),
};
