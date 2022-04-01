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

import RPClient from '@reportportal/client-javascript';
import stripAnsi from 'strip-ansi';
import {
  Reporter,
  Suite as PWSuite,
  TestCase,
  TestResult,
  TestStep,
} from '@playwright/test/reporter';
import {
  Attribute,
  FinishTestItemObjType,
  LogRQ,
  ReportPortalConfig,
  StartLaunchObjType,
  StartTestObjType,
} from './models';
import { LOG_LEVELS, STATUSES, TEST_ITEM_TYPES } from './constants';
import {
  convertToRpStatus,
  getAgentInfo,
  getAttachments,
  getCodeRef,
  getSystemAttributes,
  isErrorLog,
  isFalse,
  promiseErrorHandler,
} from './utils';
import path from 'path';
import { EVENTS } from '@reportportal/client-javascript/lib/constants/events';

export interface TestItem {
  id: string;
  name: string;
  status?: STATUSES;
  attributes?: Attribute[];
  description?: string;
  testCaseId?: string;
  playwrightProjectName?: string;
}

interface Suite extends TestItem {
  rootSuite?: string;
  logs?: LogRQ[];
  testsLength?: number;
  rootSuiteLength?: number | undefined;
}

export class RPReporter implements Reporter {
  config: ReportPortalConfig;

  client: RPClient;

  launchId: string;

  suites: Map<string, Suite>;

  suitesInfo: Map<string, Omit<Suite, 'id'>>;

  promises: Promise<void>[];

  testItems: Map<string, TestItem>;

  customLaunchStatus: string;

  launchLogs: Map<string, LogRQ>;

  nestedSteps: Map<string, TestItem>;

  constructor(config: ReportPortalConfig) {
    this.config = config;
    this.suites = new Map();
    this.suitesInfo = new Map();
    this.testItems = new Map();
    this.promises = [];
    this.customLaunchStatus = '';
    this.launchLogs = new Map();
    this.nestedSteps = new Map();

    const agentInfo = getAgentInfo();

    this.client = new RPClient(this.config, agentInfo);
  }

  addRequestToPromisesQueue(promise: Promise<void>, failMessage: string): void {
    this.promises.push(promiseErrorHandler(promise, failMessage));
  }

  onStdOut(chunk: string | Buffer, test?: TestCase): void {
    try {
      const { type, data, suite: suiteName } = JSON.parse(String(chunk));

      switch (type) {
        case EVENTS.ADD_ATTRIBUTES:
          this.addAttributes(data, test, suiteName);
          break;
        case EVENTS.SET_DESCRIPTION:
          this.setDescription(data, test, suiteName);
          break;
        case EVENTS.SET_TEST_CASE_ID:
          this.setTestCaseId(data, test, suiteName);
          break;
        case EVENTS.SET_STATUS:
          this.setStatus(data, test, suiteName);
          break;
        case EVENTS.SET_LAUNCH_STATUS:
          this.setLaunchStatus(data);
          break;
        case EVENTS.ADD_LOG:
          this.sendTestItemLog(data, test, suiteName);
          break;
        case EVENTS.ADD_LAUNCH_LOG:
          this.sendLaunchLog(data);
          break;
      }
    } catch (e) {
      if (test) {
        this.sendTestItemLog({ message: String(chunk) }, test);
      }
    }
  }

  onStdErr(chunk: string | Buffer, test?: TestCase): void {
    if (test) {
      const message = String(chunk);
      const level = isErrorLog(message) ? LOG_LEVELS.ERROR : LOG_LEVELS.WARN;
      this.sendTestItemLog({ level, message }, test);
    }
  }

  addAttributes(attr: Attribute[], test: TestCase, suiteName: string): void {
    const testItem = this.findTestItem(this.testItems, test?.title);
    if (testItem) {
      const attributes = (testItem.attributes || []).concat(attr);
      this.testItems.set(testItem.id, { ...testItem, attributes });
    } else {
      const suiteItem = this.suitesInfo.get(suiteName);
      const attributes = (suiteItem?.attributes || []).concat(attr);
      this.suitesInfo.set(suiteName, { ...suiteItem, attributes });
    }
  }

  setDescription(description: string, test: TestCase, suiteName: string): void {
    const testItem = this.findTestItem(this.testItems, test?.title);
    if (testItem) {
      this.testItems.set(testItem.id, { ...testItem, description });
    } else {
      this.suitesInfo.set(suiteName, { ...this.suitesInfo.get(suiteName), description });
    }
  }

  setTestCaseId(testCaseId: string, test: TestCase, suiteName: string): void {
    const testItem = this.findTestItem(this.testItems, test?.title);
    if (testItem) {
      this.testItems.set(testItem.id, { ...testItem, testCaseId });
    } else {
      this.suitesInfo.set(suiteName, { ...this.suitesInfo.get(suiteName), testCaseId });
    }
  }

  setStatus(status: STATUSES, test: TestCase, suiteName: string): void {
    const testItem = this.findTestItem(this.testItems, test?.title);
    if (testItem) {
      this.testItems.set(testItem.id, { ...testItem, status });
    } else {
      this.suitesInfo.set(suiteName, { ...this.suitesInfo.get(suiteName), status });
    }
  }

  setLaunchStatus(status: STATUSES): void {
    this.customLaunchStatus = status;
  }

  sendTestItemLog(log: LogRQ, test: TestCase, suiteName?: string): void {
    const testItem = this.findTestItem(this.testItems, test?.title);
    if (testItem) {
      this.sendLog(testItem.id, log);
    } else {
      const suiteItem = this.suitesInfo.get(suiteName);
      const logs = (suiteItem?.logs || []).concat(log);
      this.suitesInfo.set(suiteName, { ...suiteItem, logs });
    }
  }

  sendLaunchLog(log: LogRQ): void {
    const currentLog = this.launchLogs.get(log.message);
    if (!currentLog) {
      this.sendLog(this.launchId, log);
      this.launchLogs.set(log.message, log);
    }
  }

  sendLog(tempId: string, { level = LOG_LEVELS.INFO, message = '', file }: LogRQ): void {
    const { promise } = this.client.sendLog(
      tempId,
      {
        message,
        level,
        time: this.client.helpers.now(),
      },
      file,
    );
    promiseErrorHandler(promise, 'Failed to send log');
  }

  finishSuites(testFileName?: string, rootSuiteName?: string): void {
    let finishSuites: [string, Suite][];
    const suitesArray = Array.from(this.suites);

    const isExistTestsInRootSuite = this.suites.get(rootSuiteName).rootSuiteLength === 0;

    if (isExistTestsInRootSuite) {
      finishSuites = testFileName
        ? suitesArray.filter(([key]) => key.includes(rootSuiteName))
        : suitesArray;
    } else {
      finishSuites = testFileName
        ? suitesArray.filter(
            ([key, { testsLength }]) => key.includes(rootSuiteName) && testsLength < 1,
          )
        : suitesArray;
    }

    finishSuites.forEach(([key, { id, status, logs }]) => {
      if (logs) {
        logs.map((log) => {
          this.sendLog(id, log);
        });
      }

      const finishSuiteObj: FinishTestItemObjType = {
        endTime: this.client.helpers.now(),
        ...(status && { status }),
      };
      const { promise } = this.client.finishTestItem(id, finishSuiteObj);
      this.addRequestToPromisesQueue(promise, 'Failed to finish suite.');
      this.suites.delete(key);
    });
  }

  onBegin(): void {
    const { launch, description, attributes, skippedIssue, rerun, rerunOf } = this.config;
    const systemAttributes: Attribute[] = getSystemAttributes(skippedIssue);

    const startLaunchObj: StartLaunchObjType = {
      name: launch,
      startTime: this.client.helpers.now(),
      description,
      attributes:
        attributes && attributes.length ? attributes.concat(systemAttributes) : systemAttributes,
      rerun,
      rerunOf,
    };
    const { tempId, promise } = this.client.startLaunch(startLaunchObj);
    this.addRequestToPromisesQueue(promise, 'Failed to launch run.');
    this.launchId = tempId;
  }

  findTestItem(testItems: Map<string, TestItem>, title: string, projectName?: string): Suite {
    if (projectName) {
      for (const [, value] of testItems) {
        if (value.name === title && projectName === value.playwrightProjectName) {
          return value;
        }
      }
    } else {
      for (const [, value] of testItems) {
        if (value.name === title) {
          return value;
        }
      }
    }
  }

  createSuitesOrder(suite: PWSuite, suitesOrder: PWSuite[]): void {
    if (!suite?.title) {
      return;
    }
    suitesOrder.push(suite);
    this.createSuitesOrder(suite.parent, suitesOrder);
  }

  createSuites(test: TestCase): string {
    const orderedSuites: PWSuite[] = [];
    this.createSuitesOrder(test.parent, orderedSuites);

    const lastSuiteIndex = orderedSuites.length - 1;
    const projectName = test.parent.project().name;

    for (let i = lastSuiteIndex; i >= 0; i--) {
      const currentSuiteTitle = orderedSuites[i].title;
      const fullSuiteName = getCodeRef(test, currentSuiteTitle);

      if (this.suites.get(fullSuiteName)?.id) {
        continue;
      }

      const testItemType = i === lastSuiteIndex ? TEST_ITEM_TYPES.SUITE : TEST_ITEM_TYPES.TEST;
      const codeRef = getCodeRef(test, currentSuiteTitle, projectName);
      const { attributes, description, testCaseId, status, logs } =
        this.suitesInfo.get(currentSuiteTitle) || {};

      const startSuiteObj: StartTestObjType = {
        name: currentSuiteTitle,
        startTime: this.client.helpers.now(),
        type: testItemType,
        codeRef,
        ...(attributes && { attributes }),
        ...(description && { description }),
        ...(testCaseId && { testCaseId }),
      };
      const parentSuiteName = getCodeRef(test, orderedSuites[i + 1]?.title);
      const parentId = this.suites.get(parentSuiteName)?.id;
      const suiteObj = this.client.startTestItem(startSuiteObj, this.launchId, parentId);
      this.addRequestToPromisesQueue(suiteObj.promise, 'Failed to start suite.');

      let rootSuiteLength =
        i === lastSuiteIndex ? orderedSuites[lastSuiteIndex].allTests().length : undefined;

      let testsLength = orderedSuites[i].allTests().length;

      if (test.retries) {
        testsLength = testsLength * (test.retries + 1);
        rootSuiteLength = rootSuiteLength * (test.retries + 1);
      }

      this.suites.set(fullSuiteName, {
        id: suiteObj.tempId,
        name: currentSuiteTitle,
        testsLength,
        rootSuiteLength,
        rootSuite: getCodeRef(test, orderedSuites[lastSuiteIndex].title),
        ...(status && { status }),
        ...(logs && { logs }), // TODO: may be send it on suite start
      });

      this.suitesInfo.delete(currentSuiteTitle);
    }

    return projectName;
  }

  onTestBegin(test: TestCase): void {
    const playwrightProjectName = this.createSuites(test);

    const fullSuiteName = getCodeRef(test, test.parent.title);
    const parentSuiteObj = this.suites.get(fullSuiteName);

    // create step
    if (parentSuiteObj) {
      const codeRef = getCodeRef(test, test.title, playwrightProjectName);
      const { id: parentId } = parentSuiteObj;
      const startTestItem: StartTestObjType = {
        name: test.title,
        startTime: this.client.helpers.now(),
        type: TEST_ITEM_TYPES.STEP,
        codeRef,
        retry: test.results?.length > 1,
      };
      const stepObj = this.client.startTestItem(startTestItem, this.launchId, parentId);
      this.addRequestToPromisesQueue(stepObj.promise, 'Failed to start test.');
      this.testItems.set(stepObj.tempId, {
        name: test.title,
        id: stepObj.tempId,
        playwrightProjectName,
      });
    }
  }

  onStepBegin(test: TestCase, result: TestResult, step: TestStep): void {
    const { includeTestSteps } = this.config;
    if (!includeTestSteps) return;
    const playwrightProjectName = test.parent.project().name;
    const { id: testItemId } = this.findTestItem(this.testItems, test.title, playwrightProjectName);
    const stepStartObj = {
      name: step.title,
      type: TEST_ITEM_TYPES.STEP,
      hasStats: false,
      startTime: this.client.helpers.now(),
    };
    const { tempId, promise } = this.client.startTestItem(stepStartObj, this.launchId, testItemId);

    this.addRequestToPromisesQueue(promise, 'Failed to start nested step.');

    this.nestedSteps.set(tempId, {
      name: step.title,
      id: tempId,
      playwrightProjectName,
    });
  }

  onStepEnd(test: TestCase, result: TestResult, step: TestStep): void {
    const { includeTestSteps } = this.config;
    if (!includeTestSteps) return;
    const playwrightProjectName = test.parent.project().name;
    const { id } = this.findTestItem(this.nestedSteps, step.title, playwrightProjectName);
    const stepFinishObj = {
      status: step.error ? STATUSES.FAILED : STATUSES.PASSED,
      endTime: this.client.helpers.now(),
    };

    const { promise } = this.client.finishTestItem(id, stepFinishObj);

    this.addRequestToPromisesQueue(promise, 'Failed to finish nested step.');
    this.nestedSteps.delete(id);
  }

  async onTestEnd(test: TestCase, result: TestResult): Promise<void> {
    const playwrightProjectName = test.parent.project().name;
    const {
      id: testItemId,
      attributes,
      description,
      testCaseId,
      status: predefinedStatus,
    } = this.findTestItem(this.testItems, test.title, playwrightProjectName);
    let withoutIssue;
    let testDescription = description;
    const status = predefinedStatus || convertToRpStatus(result.status);
    if (status === STATUSES.SKIPPED) {
      withoutIssue = isFalse(this.config.skippedIssue);
    }

    if (result.attachments?.length) {
      const attachmentsFiles = await getAttachments(result.attachments);

      attachmentsFiles.map((file) => {
        this.sendLog(testItemId, {
          message: `Attachment ${file.name} with type ${file.type}`,
          file,
        });
      });
    }

    if (result.error) {
      const stacktrace = stripAnsi(result.error.stack || result.error.message);
      this.sendLog(testItemId, {
        level: LOG_LEVELS.ERROR,
        message: stacktrace,
      });
      testDescription = (description || '').concat(`\n\`\`\`error\n${stacktrace}\n\`\`\``);
    }
    const finishTestItemObj: FinishTestItemObjType = {
      endTime: this.client.helpers.now(),
      status,
      ...(withoutIssue && { issue: { issueType: 'NOT_ISSUE' } }),
      ...(attributes && { attributes }),
      ...(testDescription && { description: testDescription }),
      ...(testCaseId && { testCaseId }),
    };
    const { promise } = this.client.finishTestItem(testItemId, finishTestItemObj);

    this.addRequestToPromisesQueue(promise, 'Failed to finish test.');
    this.testItems.delete(testItemId);

    const fullSuiteName = getCodeRef(test, test.parent.title);
    const parentSuiteObj = this.suites.get(fullSuiteName);
    const rootSuiteName = parentSuiteObj.rootSuite;
    const rootSuite = this.suites.get(rootSuiteName);

    this.suites.set(rootSuiteName, {
      ...rootSuite,
      rootSuiteLength: rootSuite.rootSuiteLength - 1,
    });

    const testFileName = path.parse(test.location.file).base;

    Array.from(this.suites)
      .filter(([key]) => key.includes(testFileName) && key.includes(rootSuiteName))
      .map(([key, { testsLength }]) => {
        this.suites.set(key, {
          ...this.suites.get(key),
          testsLength: testsLength - 1,
        });
      });

    if (this.suites.get(fullSuiteName).testsLength === 0) {
      this.finishSuites(testFileName, rootSuiteName);
    }
  }

  async onEnd(): Promise<void> {
    const { promise } = this.client.finishLaunch(this.launchId, {
      endTime: this.client.helpers.now(),
      ...(this.customLaunchStatus && { status: this.customLaunchStatus }),
    });
    this.addRequestToPromisesQueue(promise, 'Failed to finish launch.');
    await Promise.all(this.promises);
    this.launchId = null;
  }
}
