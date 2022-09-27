/*
 *  Copyright 2022 EPAM Systems
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
import { LAUNCH_MODES, LOG_LEVELS, STATUSES, TEST_ITEM_TYPES } from './constants';
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
import { EVENTS } from '@reportportal/client-javascript/lib/constants/events';

export interface TestItem {
  id: string;
  name: string;
  status?: STATUSES;
  attributes?: Attribute[];
  description?: string;
  testCaseId?: string;
}

interface Suite extends TestItem {
  logs?: LogRQ[];
  testCount?: number;
  descendants?: string[];
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
    if (suiteName) {
      const suiteItem = this.suitesInfo.get(suiteName);
      const attributes = (suiteItem?.attributes || []).concat(attr);
      this.suitesInfo.set(suiteName, { ...suiteItem, attributes });
    } else if (test) {
      const fullTestName = getCodeRef(test, test.title);
      const testItem = this.testItems.get(fullTestName);

      if (testItem) {
        const attributes = (testItem.attributes || []).concat(attr);
        this.testItems.set(fullTestName, { ...testItem, attributes });
      }
    }
  }

  setDescription(description: string, test: TestCase, suiteName: string): void {
    if (suiteName) {
      this.suitesInfo.set(suiteName, { ...this.suitesInfo.get(suiteName), description });
    } else if (test) {
      const fullTestName = getCodeRef(test, test.title);
      const testItem = this.testItems.get(fullTestName);

      if (testItem) {
        this.testItems.set(fullTestName, { ...testItem, description });
      }
    }
  }

  setTestCaseId(testCaseId: string, test: TestCase, suiteName: string): void {
    if (suiteName) {
      this.suitesInfo.set(suiteName, { ...this.suitesInfo.get(suiteName), testCaseId });
    } else if (test) {
      const fullTestName = getCodeRef(test, test.title);
      const testItem = this.testItems.get(fullTestName);

      if (testItem) {
        this.testItems.set(fullTestName, { ...testItem, testCaseId });
      }
    }
  }

  setStatus(status: STATUSES, test: TestCase, suiteName: string): void {
    if (suiteName) {
      this.suitesInfo.set(suiteName, { ...this.suitesInfo.get(suiteName), status });
    } else if (test) {
      const fullTestName = getCodeRef(test, test.title);
      const testItem = this.testItems.get(fullTestName);

      if (testItem) {
        this.testItems.set(fullTestName, { ...testItem, status });
      }
    }
  }

  setLaunchStatus(status: STATUSES): void {
    this.customLaunchStatus = status;
  }

  sendTestItemLog(log: LogRQ, test: TestCase, suiteName?: string): void {
    if (suiteName) {
      const suiteItem = this.suitesInfo.get(suiteName);
      const logs = (suiteItem?.logs || []).concat(log);
      this.suitesInfo.set(suiteName, { ...suiteItem, logs });
    } else if (test) {
      const fullTestName = getCodeRef(test, test.title);
      const testItem = this.testItems.get(fullTestName);

      if (testItem) {
        this.sendLog(testItem.id, log);
      }
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

  finishSuites(): void {
    const suitesToFinish = Array.from(this.suites).filter(([, { testCount }]) => testCount < 1);

    suitesToFinish.forEach(([key, { id, status, logs }]) => {
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
    const { launch, description, attributes, skippedIssue, rerun, rerunOf, mode } = this.config;
    const systemAttributes: Attribute[] = getSystemAttributes(skippedIssue);

    const startLaunchObj: StartLaunchObjType = {
      name: launch,
      startTime: this.client.helpers.now(),
      description,
      attributes:
        attributes && attributes.length ? attributes.concat(systemAttributes) : systemAttributes,
      rerun,
      rerunOf,
      mode: mode || LAUNCH_MODES.DEFAULT,
    };
    const { tempId, promise } = this.client.startLaunch(startLaunchObj);
    this.addRequestToPromisesQueue(promise, 'Failed to launch run.');
    this.launchId = tempId;
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
      const currentSuite = orderedSuites[i];
      const currentSuiteTitle = currentSuite.title;
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

      const allSuiteTests = currentSuite.allTests();
      const descendants = allSuiteTests.map((testCase) => getCodeRef(testCase, testCase.title));
      let testCount = allSuiteTests.length;

      // TODO: cover with tests
      if (test.retries) {
        const possibleInvocations = test.retries + 1;
        testCount = testCount * possibleInvocations;
      }

      this.suites.set(fullSuiteName, {
        id: suiteObj.tempId,
        name: currentSuiteTitle,
        testCount,
        descendants,
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
      const { includePlaywrightProjectNameToCodeReference } = this.config;
      const codeRef = getCodeRef(
        test,
        test.title,
        !includePlaywrightProjectNameToCodeReference && playwrightProjectName,
      );
      const fullTestName = getCodeRef(test, test.title);
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
      this.testItems.set(fullTestName, {
        name: test.title,
        id: stepObj.tempId,
      });
    }
  }

  onStepBegin(test: TestCase, result: TestResult, step: TestStep): void {
    const { includeTestSteps } = this.config;
    if (!includeTestSteps) return;

    const fullTestName = getCodeRef(test, test.title);
    let parent;
    if (step.parent) {
      const stepParentName = getCodeRef(step.parent, step.parent.title);
      const fullStepParentName = `${fullTestName}/${stepParentName}`;
      parent = this.nestedSteps.get(fullStepParentName);
    } else {
      parent = this.testItems.get(fullTestName);
    }
    if (!parent) return;

    const stepStartObj = {
      name: step.title,
      type: TEST_ITEM_TYPES.STEP,
      hasStats: false,
      startTime: this.client.helpers.now(),
    };
    const stepName = getCodeRef(step, step.title);
    const fullStepName = `${fullTestName}/${stepName}`;
    const { tempId, promise } = this.client.startTestItem(stepStartObj, this.launchId, parent.id);

    this.addRequestToPromisesQueue(promise, 'Failed to start nested step.');

    this.nestedSteps.set(fullStepName, {
      name: step.title,
      id: tempId,
    });
  }

  onStepEnd(test: TestCase, result: TestResult, step: TestStep): void {
    const { includeTestSteps } = this.config;
    if (!includeTestSteps) return;

    const fullTestName = getCodeRef(test, test.title);
    const stepName = getCodeRef(step, step.title);
    const fullStepName = `${fullTestName}/${stepName}`;
    const testItem = this.nestedSteps.get(fullStepName);
    if (!testItem) return;

    const stepFinishObj = {
      status: step.error ? STATUSES.FAILED : STATUSES.PASSED,
      endTime: this.client.helpers.now(),
    };

    const { promise } = this.client.finishTestItem(testItem.id, stepFinishObj);

    this.addRequestToPromisesQueue(promise, 'Failed to finish nested step.');
    this.nestedSteps.delete(fullStepName);
  }

  async onTestEnd(test: TestCase, result: TestResult): Promise<void> {
    const fullTestName = getCodeRef(test, test.title);
    const {
      id: testItemId,
      attributes,
      description,
      testCaseId,
      status: predefinedStatus,
    } = this.testItems.get(fullTestName);
    let withoutIssue;
    let testDescription = description;
    const status = predefinedStatus || convertToRpStatus(result.status);
    if (status === STATUSES.SKIPPED) {
      withoutIssue = isFalse(this.config.skippedIssue);
    }

    // TODO: cover with tests
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
    this.testItems.delete(fullTestName);

    this.updateAncestorsTestCount(test, result, status);

    const fullParentName = getCodeRef(test, test.parent.title);

    // if all children of the test parent have already finished, then finish all empty ancestors
    if (this.suites.get(fullParentName).testCount < 1) {
      this.finishSuites();
    }
  }

  // TODO: cover with tests
  updateAncestorsTestCount(test: TestCase, result: TestResult, calculatedStatus: STATUSES): void {
    // decrease by 1 by default as only one test case finished
    let decreaseIndex = 1;
    // TODO: post an issue on GitHub for playwright/test to provide more clear output for this purpose
    const isTestFinishedFromHook = result.workerIndex === -1; // in case test finished by hook error it will be retried
    const nonRetriedResult =
      calculatedStatus === STATUSES.PASSED ||
      (calculatedStatus === STATUSES.SKIPPED && !isTestFinishedFromHook);

    // if test case has retries, and it will not be retried anymore
    if (test.retries > 0 && nonRetriedResult) {
      const possibleInvocations = test.retries + 1;
      const possibleInvocationsLeft = possibleInvocations - test.results.length;
      // we need to decrease also all the rest possible invocations as the test case will not be retried anymore
      decreaseIndex = decreaseIndex + possibleInvocationsLeft;
    }

    const fullTestName = getCodeRef(test, test.title);

    this.suites.forEach((value, key) => {
      const { descendants, testCount } = value;

      if (descendants.length && descendants.includes(fullTestName)) {
        const newTestCount = testCount - decreaseIndex;
        this.suites.set(key, {
          ...value,
          testCount: newTestCount,
          descendants:
            newTestCount < 1
              ? descendants.filter((testName) => testName !== fullTestName)
              : descendants,
        });
      }
    });
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
