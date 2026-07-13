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

import helpers from '@reportportal/client-javascript/lib/helpers';
import { RPReporter } from '../../reporter';
import { TEST_ANNOTATION_TYPES } from '../../constants';
import { mockConfig } from '../mocks/configMock';
import { RPClientMock, mockedDate } from '../mocks/RPClientMock';

const playwrightProjectName = 'projectName';
const suiteName = 'suiteName';
const tempTestItemId = 'tempTestItemId';

describe('onStepBegin reporting', () => {
  jest.spyOn(helpers, 'now').mockReturnValue(mockedDate);
  const config = {
    ...mockConfig,
    includeTestSteps: true,
  };
  const reporter = new RPReporter(config);
  reporter.client = new RPClientMock(config);

  reporter.launchId = 'launchId';

  reporter.testItems = new Map([['testItemId', { id: tempTestItemId, name: 'testTitle' }]]);

  reporter.nestedSteps = new Map([
    [
      'testItemId/stepName-b91c7967-f32d-4cb7-843f-78a7b62e0055',
      { id: tempTestItemId, name: 'stepName' },
    ],
  ]);

  const testCase = {
    title: 'testTitle',
    id: 'testItemId',
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
    id: 'b91c7967-f32d-4cb7-843f-78a7b62e0055',
    error: {
      message: 'some error',
    },
    titlePath: () => ['stepName'],
  };

  // @ts-ignore
  reporter.onStepEnd(testCase, undefined, step);

  test('client.finishTestItem should be called with corresponding params', () => {
    const expectedStepObj = {
      endTime: mockedDate,
      status: 'failed',
    };

    expect(reporter.client.finishTestItem).toHaveBeenCalledWith(tempTestItemId, expectedStepObj);
  });

  test('nestedSteps should be clear', () => {
    expect(reporter.nestedSteps).toEqual(new Map());
  });
});

describe('onStepEnd reporting for skipped step', () => {
  jest.spyOn(helpers, 'now').mockReturnValue(mockedDate);
  const config = {
    ...mockConfig,
    includeTestSteps: true,
  };
  const reporter = new RPReporter(config);
  reporter.client = new RPClientMock(config);
  reporter.launchId = 'launchId';

  const testCase = {
    title: 'testTitle',
    id: 'testItemId',
    parent: {
      title: 'suiteName',
      project: () => ({ name: 'projectName' }),
      parent: {
        title: 'projectName',
        project: () => ({ name: 'projectName' }),
      },
    },
    titlePath: () => ['', 'projectName', 'suiteName', 'testTitle'],
  };

  const stepId = 'b91c7967-f32d-4cb7-843f-78a7b62e0055';

  beforeEach(() => {
    jest.clearAllMocks();
    reporter.testItems = new Map([['testItemId', { id: 'tempTestItemId', name: 'testTitle' }]]);
    reporter.nestedSteps = new Map([
      [
        'testItemId/stepName-b91c7967-f32d-4cb7-843f-78a7b62e0055',
        { id: 'stepItemId', name: 'stepName' },
      ],
    ]);
  });

  test.each([
    [TEST_ANNOTATION_TYPES.SKIP, 'Step is not applicable.'],
    [TEST_ANNOTATION_TYPES.FIXME, 'Feature not implemented.'],
  ])(
    'client.finishTestItem should be called with skipped status for %s annotation',
    async (type, reason) => {
      const step = {
        title: 'stepName',
        id: stepId,
        annotations: [{ type, description: reason }],
        titlePath: () => ['stepName'],
      };

      // @ts-ignore
      await reporter.onStepEnd(testCase, undefined, step);

      expect(reporter.client.finishTestItem).toHaveBeenCalledWith('stepItemId', {
        endTime: mockedDate,
        status: 'skipped',
      });
      expect(reporter.client.sendLog).toHaveBeenCalledWith(
        'stepItemId',
        expect.objectContaining({
          level: 'INFO',
          message: `**Skip reason: ${reason}**`,
        }),
        undefined,
      );
    },
  );

  test('client.finishTestItem should be called with skipped status when skip annotation has no description', async () => {
    const step = {
      title: 'stepName',
      id: stepId,
      annotations: [{ type: TEST_ANNOTATION_TYPES.SKIP }],
      titlePath: () => ['stepName'],
    };

    // @ts-ignore
    await reporter.onStepEnd(testCase, undefined, step);

    expect(reporter.client.finishTestItem).toHaveBeenCalledWith('stepItemId', {
      endTime: mockedDate,
      status: 'skipped',
    });
    expect(reporter.client.sendLog).not.toHaveBeenCalled();
  });

  test('skipped step with error should use skipped status and not log error', async () => {
    const step = {
      title: 'stepName',
      id: stepId,
      annotations: [{ type: TEST_ANNOTATION_TYPES.SKIP, description: 'Not ready yet' }],
      error: {
        message: 'some error',
        stack: 'Error: some error\n  at test.js:10',
      },
      titlePath: () => ['stepName'],
    };

    // @ts-ignore
    await reporter.onStepEnd(testCase, undefined, step);

    expect(reporter.client.finishTestItem).toHaveBeenCalledWith('stepItemId', {
      endTime: mockedDate,
      status: 'skipped',
    });
    expect(reporter.client.sendLog).toHaveBeenCalledTimes(1);
    expect(reporter.client.sendLog).toHaveBeenCalledWith(
      'stepItemId',
      expect.objectContaining({
        level: 'INFO',
        message: '**Skip reason: Not ready yet**',
      }),
      undefined,
    );
  });
});
