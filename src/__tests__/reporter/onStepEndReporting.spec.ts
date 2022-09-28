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

const playwrightProjectName = 'projectName';
const suiteName = 'suiteName';
const tempTestItemId = 'tempTestItemId';

describe('onStepBegin reporting', () => {
  mockConfig.includeTestSteps = true;
  const reporter = new RPReporter(mockConfig);
  reporter.client = new RPClientMock(mockConfig);

  reporter.launchId = 'launchId';

  reporter.testItems = new Map([
    [`${playwrightProjectName}/${suiteName}/testTitle`, { id: tempTestItemId, name: 'testTitle' }],
  ]);

  reporter.nestedSteps = new Map([
    [
      `${playwrightProjectName}/${suiteName}/testTitle/stepName`,
      { id: tempTestItemId, name: 'stepName' },
    ],
  ]);

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

  const step = {
    title: 'stepName',
    error: {
      message: 'some error',
    },
    titlePath: () => ['stepName'],
  };

  // @ts-ignore
  reporter.onStepEnd(testParams, undefined, step);

  test('client.finishTestItem should be called with corresponding params', () => {
    const expectedStepObj = {
      endTime: reporter.client.helpers.now(),
      status: 'failed',
    };

    expect(reporter.client.finishTestItem).toHaveBeenCalledWith(tempTestItemId, expectedStepObj);
  });

  test('nestedSteps should be clear', () => {
    expect(reporter.nestedSteps).toEqual(new Map());
  });
});
