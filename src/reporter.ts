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
import { Reporter } from '@playwright/test/reporter';
import { Attribute, ReportPortalConfig } from './models';
import { TEST_ITEM_TYPES } from './constants';
import { getConfig } from './utils';
import { StartLaunchObjType, StartTestObjType, FinishTestItemObjType } from './models/reporting';

const promiseErrorHandler = (promise: Promise<any>, message = '') =>
  promise.catch((err) => {
    console.error(message, err);
  });

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

class MyReporter implements Reporter {
  private RPconfig: ReportPortalConfig;

  private client: RPClient;

  private launchId: string;

  private suites: Map<string, Suite>;

  private testItems: Map<string, TestItem>;

  private promises: Promise<any>[];

  constructor() {
    this.RPconfig = getConfig();
    this.client = new RPClient(this.RPconfig);
    this.suites = new Map();
    this.testItems = new Map();
    this.promises = [];
  }

  addRequestToPromisesQueue(promise: any, failMessage: string): void {
    this.promises.push(promiseErrorHandler(promise, failMessage));
  }

  finishSuites(): void {
    this.suites.forEach(({ id }) => {
      const finishSuiteObj: FinishTestItemObjType = {
        endTime: this.client.helpers.now(),
      };
      const { promise } = this.client.finishTestItem(id, finishSuiteObj);
      this.addRequestToPromisesQueue(promise, 'Failed to finish suite.');
    });
    this.suites.clear();
  }

  onBegin(): void {
    const { launch, description, attributes } = this.RPconfig;
    const startLaunchObj: StartLaunchObjType = {
      name: launch,
      startTime: this.client.helpers.now(),
      attributes,
      description,
    };
    const { tempId, promise } = this.client.startLaunch(startLaunchObj);
    this.addRequestToPromisesQueue(promise, 'Failed to launch run.');
    this.launchId = tempId;
  }

  onTestBegin(test: any): void {
    //create suite
    if (!this.suites.has(test.parent.title)) {
      const startSuiteObj: StartTestObjType = {
        description: 'suite description',
        name: test.parent.title,
        startTime: this.client.helpers.now(),
        type: TEST_ITEM_TYPES.SUITE,
      };
      const suiteObj = this.client.startTestItem(startSuiteObj, this.launchId);
      this.addRequestToPromisesQueue(suiteObj.promise, 'Failed to start suite.');
      this.suites.set(test.parent.title, {
        id: suiteObj.tempId,
        path: test.location.file,
        name: test.title,
      });
    }

    //create steps
    if (this.suites.get(test.parent.title)) {
      const { id: parentId, name: suiteName } = this.suites.get(test.parent.title);
      const startTestItem: StartTestObjType = {
        description: 'description step',
        name: test.title,
        startTime: this.client.helpers.now(),
        attributes: [
          {
            key: 'yourKey',
            value: 'yourValue',
          },
        ],
        type: TEST_ITEM_TYPES.STEP,
      };
      const stepObj = this.client.startTestItem(startTestItem, this.launchId, parentId);
      this.addRequestToPromisesQueue(stepObj.promise, 'Failed to start test.');
      this.testItems.set(test.title, {
        name: test.title,
        id: stepObj.tempId,
        description: 'description step',
      });
    }
  }

  onTestEnd(test: any, result: any): void {
    const { id: testItemId } = this.testItems.get(test.title);
    const finishTestItemObj: FinishTestItemObjType = {
      endTime: this.client.helpers.now(),
      status: result.status,
    };
    const { promise } = this.client.finishTestItem(testItemId, finishTestItemObj);

    this.addRequestToPromisesQueue(promise, 'Failed to finish test.');
    this.testItems.delete(test.title);
  }

  async onEnd(result: any): Promise<void> {
    this.finishSuites();
    const { promise } = this.client.finishLaunch(this.launchId, {
      endTime: this.client.helpers.now(),
    });
    this.addRequestToPromisesQueue(promise, 'Failed to finish launch.');
    await Promise.all(this.promises);
    this.launchId = null;
  }
}

export default MyReporter;
