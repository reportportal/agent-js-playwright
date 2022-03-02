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
const tempTestItemId = 'tempTestItemId';

describe('onStepBegin reporting', () => {
  mockConfig.includeTestSteps = true;
  const reporter = new RPReporter(mockConfig);
  reporter.client = new RPClientMock(mockConfig);

  reporter.launchId = 'launchId';

  reporter.testItems = new Map([
    [tempTestItemId, { id: tempTestItemId, name: 'testName', playwrightProjectName }],
  ]);

  const testParams = {
    title: 'testName',
    parent: {
      title: 'suiteName',
      project: () => ({ name: playwrightProjectName }),
    },
  };

  const step = {
    title: 'stepName',
    error: {
      message: 'some error',
    },
  };
  // @ts-ignore
  reporter.onStepBegin(testParams, undefined, step);

  test('client.startTestItem should be called with corresponding params', () => {
    const expectedStepObj = {
      name: step.title,
      type: TEST_ITEM_TYPES.STEP,
      hasStats: false,
      startTime: reporter.client.helpers.now(),
    };

    expect(reporter.client.startTestItem).toHaveBeenCalledWith(
      expectedStepObj,
      reporter.launchId,
      tempTestItemId,
    );
  });

  test('stepInfo should be updated', () => {
    const exptectedStepInfo = new Map([
      [tempTestItemId, { id: tempTestItemId, name: 'stepName', playwrightProjectName }],
    ]);

    expect(reporter.stepInfo).toEqual(exptectedStepInfo);
  });
});
