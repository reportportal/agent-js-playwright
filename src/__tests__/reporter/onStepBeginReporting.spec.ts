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
 */

import { RPReporter } from '../../reporter';
import { mockConfig } from '../mocks/configMock';
import { RPClientMock } from '../mocks/RPClientMock';
import { TEST_ITEM_TYPES } from '../../constants';

const playwrightProjectName = 'projectName';
const suiteName = 'suiteName';
const tempTestItemId = 'tempTestItemId';

describe('onStepBegin reporting', () => {
  let reporter: RPReporter;

  beforeEach(() => {
    mockConfig.includeTestSteps = true;
    reporter = new RPReporter(mockConfig);
    reporter.client = new RPClientMock(mockConfig);

    reporter.launchId = 'launchId';

    reporter.testItems = new Map([
      [
        `${playwrightProjectName}/${suiteName}/testTitle`,
        { id: tempTestItemId, name: 'testTitle' },
      ],
    ]);
  });

  const testParams = {
    title: 'testTitle',
    parent: {
      title: suiteName,
      project: () => ({ name: playwrightProjectName }),
      parent: {
        title: playwrightProjectName,
        project: () => ({ name: playwrightProjectName }),
      },
    },
    titlePath: () => ['', playwrightProjectName, suiteName, 'testTitle'],
  };

  test('client.startTestItem should be called with test item id as a parent id', () => {
    const step = {
      title: 'stepName',
      error: {
        message: 'some error',
      },
      titlePath: () => ['stepName'],
    };
    const expectedFullStepName = `${playwrightProjectName}/${suiteName}/testTitle/stepName`;
    const expectedNestedSteps = new Map([
      [expectedFullStepName, { id: tempTestItemId, name: 'stepName' }],
    ]);
    const expectedStepObj = {
      name: step.title,
      type: TEST_ITEM_TYPES.STEP,
      hasStats: false,
      startTime: reporter.client.helpers.now(),
    };

    // @ts-ignore
    reporter.onStepBegin(testParams, undefined, step);

    expect(reporter.client.startTestItem).toHaveBeenCalledWith(
      expectedStepObj,
      reporter.launchId,
      tempTestItemId,
    );
    expect(reporter.nestedSteps).toEqual(expectedNestedSteps);
  });

  test('client.startTestItem should be called with test step parent id', () => {
    const fullTestCaseName = `${playwrightProjectName}/${suiteName}/testTitle`;
    const stepParent = {
      title: 'stepParent',
      titlePath: () => ['stepParent'],
    };
    reporter.nestedSteps = new Map([
      [`${fullTestCaseName}/stepParent`, { id: 'parentStepId', name: 'stepParent' }],
    ]);
    const step = {
      title: 'stepName',
      parent: stepParent,
      error: {
        message: 'some error',
      },
      titlePath: () => ['stepParent', 'stepName'],
    };
    const expectedNestedSteps = new Map([
      [`${fullTestCaseName}/stepParent`, { id: 'parentStepId', name: 'stepParent' }],
      [`${fullTestCaseName}/stepParent/stepName`, { id: tempTestItemId, name: 'stepName' }],
    ]);
    const expectedStepObj = {
      name: step.title,
      type: TEST_ITEM_TYPES.STEP,
      hasStats: false,
      startTime: reporter.client.helpers.now(),
    };

    // @ts-ignore
    reporter.onStepBegin(testParams, undefined, step);

    expect(reporter.client.startTestItem).toHaveBeenCalledWith(
      expectedStepObj,
      reporter.launchId,
      'parentStepId',
    );
    expect(reporter.nestedSteps).toEqual(expectedNestedSteps);
  });
});
