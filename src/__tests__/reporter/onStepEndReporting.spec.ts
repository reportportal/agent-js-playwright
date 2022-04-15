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

import { TestCase, TestStep } from '@playwright/test/reporter';

import { RPReporter } from '../../reporter';
import { mockConfig } from '../mocks/configMock';
import { RPClientMock, tempLaunchId } from '../mocks/RPClientMock';

describe('Reporter.onStepEnd', () => {
  const playwrightProjectName = 'projectName';
  const reporter = new RPReporter(mockConfig);
  const testParams = {
    title: 'testName',
    parent: {
      title: 'suiteName',
      project: () => ({ name: playwrightProjectName }),
    },
  } as TestCase;
  const step = {
    title: 'stepName',
    error: {
      message: 'some error',
    },
  } as TestStep;

  beforeAll(() => {
    mockConfig.includeTestSteps = true;
    reporter.client = RPClientMock;
    reporter.launchId = 'launchId';
    reporter.testItems = new Map([
      [tempLaunchId, { id: tempLaunchId, name: 'testName', playwrightProjectName }],
    ]);
    reporter.nestedSteps = new Map([
      [tempLaunchId, { id: tempLaunchId, name: 'stepName', playwrightProjectName }],
    ]);

    jest.clearAllMocks();

    reporter.onStepEnd(testParams, undefined, step);
  });

  test('client.finishTestItem should be called with corresponding params', () => {
    const expectedStepObj = {
      endTime: reporter.client.helpers.now(),
      status: 'failed',
    };

    expect(reporter.client.finishTestItem).toHaveBeenCalledWith(tempLaunchId, expectedStepObj);
  });

  test('should clear nestedSteps', () => {
    expect(reporter.nestedSteps).toEqual(new Map());
  });
});
