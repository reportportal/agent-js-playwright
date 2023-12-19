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
 */

import { RPReporter } from '../../reporter';
import { mockConfig } from '../mocks/configMock';
import { RPClientMock } from '../mocks/RPClientMock';
import path from 'path';

const rootSuite = 'rootSuite';
const suiteName = 'example.js';

// TODO: add tests for skipped status and different workerIndex values
// TODO: add tests for serial mode
describe('finish suites on finish all of their children', () => {
  const reporter = new RPReporter(mockConfig);
  reporter.client = new RPClientMock(mockConfig);
  reporter.launchId = 'tempLaunchId';
  let spyFinishTestItem: jest.SpyInstance;

  const testCase = {
    title: 'testTitle',
    id: 'testItemId',
    parent: {
      title: rootSuite,
      project: () => ({ name: rootSuite }),
      allTests: () => [
        {
          id: 'testItemId',
          title: 'testTitle',
          titlePath: () => ['', rootSuite, suiteName, 'testTitle'],
        },
      ],
      parent: {
        title: rootSuite,
        project: () => ({ name: rootSuite }),
        allTests: () => [
          {
            id: 'testItemId',
            title: 'testTitle',
            titlePath: () => ['', rootSuite, suiteName, 'testTitle'],
          },
        ],
      },
    },
    titlePath: () => ['', rootSuite, suiteName, 'testTitle'],
    location: {
      file: `C:${path.sep}testProject${path.sep}tests${path.sep}example.js`,
    },
    outcome: () => 'expected',
    annotations: [{ type: 'custom' }],
    _staticAnnotations: [{ type: 'custom' }],
  };

  beforeEach(() => {
    spyFinishTestItem = jest.spyOn(reporter.client, 'finishTestItem');

    reporter.testItems = new Map([['testItemId', { id: 'tempTestItemId', name: 'testTitle' }]]);
    reporter.suites = new Map([
      [
        rootSuite,
        {
          id: 'rootsuiteId',
          name: rootSuite,
          testInvocationsLeft: 1,
          descendants: ['testItemId'],
        },
      ],
      [
        `${rootSuite}/${suiteName}`,
        {
          id: 'parentSuiteId',
          name: suiteName,
          testInvocationsLeft: 1,
          descendants: ['testItemId'],
        },
      ],
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('client.finishTestItem should be called with suite id after finishing last suite children', () => {
    const testResult = {
      status: 'passed',
    };
    // @ts-ignore
    reporter.onTestEnd(testCase, testResult);

    expect(spyFinishTestItem).toHaveBeenNthCalledWith(1, 'tempTestItemId', {
      endTime: reporter.client.helpers.now(),
      status: 'passed',
    });
    expect(spyFinishTestItem).toHaveBeenNthCalledWith(2, 'rootsuiteId', {
      endTime: reporter.client.helpers.now(),
    });
    expect(spyFinishTestItem).toHaveBeenNthCalledWith(3, 'parentSuiteId', {
      endTime: reporter.client.helpers.now(),
    });
    expect(reporter.suites).toEqual(new Map());
  });

  test('client.finishTestItem should be called with suite id in case of run end with unfinished suites', () => {
    reporter.onEnd();

    expect(spyFinishTestItem).toHaveBeenNthCalledWith(1, 'rootsuiteId', {
      endTime: reporter.client.helpers.now(),
    });
    expect(spyFinishTestItem).toHaveBeenNthCalledWith(2, 'parentSuiteId', {
      endTime: reporter.client.helpers.now(),
    });
    expect(reporter.suites).toEqual(new Map());
  });

  test('client.finishTestItem should be called with suite id in case of run end without unfinished suites', () => {
    reporter.suites = new Map();
    reporter.onEnd();

    expect(spyFinishTestItem).toBeCalledTimes(0);
    expect(reporter.suites).toEqual(new Map());
  });
});
