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
import { Reporter, TestResult, TestCase } from '@playwright/test/reporter';
import {
  Attribute,
  ReportPortalConfig,
  TestResp,
  FinishTestItemObjType,
  StartLaunchObjType,
  StartTestObjType,
} from './models';
import { TEST_ITEM_TYPES, STATUSES } from './constants';
import { getAgentInfo, getCodeRef, getSystemAttributes, promiseErrorHandler } from './utils';
import { EVENTS } from '@reportportal/client-javascript/lib/constants/events';

export interface TestItem {
  id: string;
  name: string;
  status?: string;
  attributes?: Attribute[];
  description?: string;
}

interface Suite {
  id: string;
  name: string;
  path?: string;
  attributes?: Attribute[];
}

class RPReporter implements Reporter {
  config: ReportPortalConfig;

  client: RPClient;

  launchId: string;

  suites: Map<string, Suite>;

  suitesStackTempId: Array<string>;

  promises: Promise<any>[];

  testItems: Map<string, TestItem>;

  suitesAttributes: Array<Attribute[]>;

  constructor(config: ReportPortalConfig) {
    this.config = config;
    this.suites = new Map();
    this.testItems = new Map();
    this.promises = [];
    this.suitesStackTempId = [];
    this.suitesAttributes = [];

    const agentInfo = getAgentInfo();

    this.client = new RPClient(this.config, agentInfo);
  }

  addRequestToPromisesQueue(promise: any, failMessage: string): void {
    this.promises.push(promiseErrorHandler(promise, failMessage));
  }

  onStdOut(chunk: string | Buffer, test?: TestCase, result?: TestResult): void {
    try {
      const { type, data } = JSON.parse(String(chunk));

      switch (type) {
        case EVENTS.ADD_ATTRIBUTES:
          this.addAttributes(data, test);
          break;
      }
    } catch (e) {}
  }

  addAttributes(attributes: Attribute[], test: TestCase): void {
    const testItem = this.isMapElementExist(this.testItems, test?.title);
    if (testItem) {
      this.testItems.set(testItem.id, { ...this.testItems.get(testItem.id), attributes });
    } else {
      this.suitesAttributes.push(attributes);
    }
  }

  finishSuites(): void {
    this.suites.forEach(({ id, attributes }) => {
      const finishSuiteObj: FinishTestItemObjType = {
        endTime: this.client.helpers.now(),
        ...(attributes && { attributes }),
      };
      const { promise } = this.client.finishTestItem(id, finishSuiteObj);
      this.addRequestToPromisesQueue(promise, 'Failed to finish suite.');
    });
    this.suites.clear();
  }

  onBegin(): void {
    const { launch, description, attributes, skippedIssue } = this.config;
    const systemAttributes: Attribute[] = getSystemAttributes(skippedIssue);

    const startLaunchObj: StartLaunchObjType = {
      name: launch,
      startTime: this.client.helpers.now(),
      description,
      attributes:
        attributes && attributes.length ? attributes.concat(systemAttributes) : systemAttributes,
    };
    const { tempId, promise } = this.client.startLaunch(startLaunchObj);
    this.addRequestToPromisesQueue(promise, 'Failed to launch run.');
    this.launchId = tempId;
  }

  isMapElementExist(suite: Map<string, Suite>, title: string): Suite {
    for (const [key, value] of suite) {
      if (value.name === title) {
        return value;
      }
    }
  }

  onTestBegin(test: TestResp): void {
    //create suite
    const suiteHasParent = test.parent.parent?._isDescribe;
    const suiteTitle = suiteHasParent ? test.parent.parent?.title : test.parent.title;
    if (!this.isMapElementExist(this.suites, suiteTitle)) {
      const codeRef = getCodeRef(test, TEST_ITEM_TYPES.SUITE);
      const startSuiteObj: StartTestObjType = {
        name: suiteTitle,
        startTime: this.client.helpers.now(),
        type: TEST_ITEM_TYPES.SUITE,
        codeRef,
      };
      const suiteObj = this.client.startTestItem(startSuiteObj, this.launchId);
      this.addRequestToPromisesQueue(suiteObj.promise, 'Failed to start suite.');
      this.suitesStackTempId.push(suiteObj.tempId);
      this.suites.set(suiteObj.tempId, {
        id: suiteObj.tempId,
        name: suiteTitle,
        ...(this.suitesAttributes.length && {
          attributes: this.suitesAttributes[this.suitesStackTempId.length - 1],
        }),
      });
    }
    //suite in suite
    if (suiteHasParent) {
      if (!this.isMapElementExist(this.suites, test.parent.title)) {
        const codeRef = getCodeRef(test, TEST_ITEM_TYPES.TEST);
        const { id: parentId } = this.isMapElementExist(this.suites, suiteTitle);
        const startChildSuiteObj: StartTestObjType = {
          name: test.parent.title,
          startTime: this.client.helpers.now(),
          type: TEST_ITEM_TYPES.TEST,
          codeRef,
        };
        const suiteObj = this.client.startTestItem(startChildSuiteObj, this.launchId, parentId);
        this.addRequestToPromisesQueue(suiteObj.promise, 'Failed to start suite.');
        this.suitesStackTempId.push(suiteObj.tempId);
        this.suites.set(suiteObj.tempId, {
          id: suiteObj.tempId,
          name: test.parent.title,
          ...(this.suitesAttributes.length && {
            attributes: this.suitesAttributes[this.suitesStackTempId.length - 1],
          }),
        });
      }
    }

    //create steps
    if (this.isMapElementExist(this.suites, test.parent.title)) {
      const codeRef = getCodeRef(test, TEST_ITEM_TYPES.STEP);
      const { id: parentId } = this.isMapElementExist(this.suites, test.parent.title);
      const startTestItem: StartTestObjType = {
        name: test.title,
        startTime: this.client.helpers.now(),
        type: TEST_ITEM_TYPES.STEP,
        codeRef,
      };
      const stepObj = this.client.startTestItem(startTestItem, this.launchId, parentId);
      this.addRequestToPromisesQueue(stepObj.promise, 'Failed to start test.');
      this.testItems.set(stepObj.tempId, {
        name: test.title,
        id: stepObj.tempId,
      });
    }
    if (
      this.suitesStackTempId.length === this.suitesAttributes.length ||
      this.suitesAttributes.length === 0
    ) {
      this.suitesAttributes = [];
      this.suitesStackTempId = [];
    }
  }

  onTestEnd(test: TestResp, result: TestResult): void {
    const { id: testItemId, attributes } = this.isMapElementExist(this.testItems, test.title);
    let withoutIssue;
    if (result.status === STATUSES.SKIPPED) {
      withoutIssue = this.config.skippedIssue === false;
    }

    const finishTestItemObj: FinishTestItemObjType = {
      endTime: this.client.helpers.now(),
      status: result.status,
      ...(withoutIssue && { issue: { issueType: 'NOT_ISSUE' } }),
      ...(attributes && { attributes }),
    };
    const { promise } = this.client.finishTestItem(testItemId, finishTestItemObj);

    this.addRequestToPromisesQueue(promise, 'Failed to finish test.');
    this.testItems.delete(testItemId);
  }

  async onEnd(): Promise<void> {
    this.finishSuites();
    const { promise } = this.client.finishLaunch(this.launchId, {
      endTime: this.client.helpers.now(),
    });
    this.addRequestToPromisesQueue(promise, 'Failed to finish launch.');
    await Promise.all(this.promises);
    this.launchId = null;
  }
}

export default RPReporter;
