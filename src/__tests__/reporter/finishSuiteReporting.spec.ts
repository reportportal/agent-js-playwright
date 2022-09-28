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

describe('finish report suite', () => {
  const reporter = new RPReporter(mockConfig);
  reporter.client = new RPClientMock(mockConfig);
  reporter.launchId = 'tempLaunchId';

  const testParams = {
    title: 'testTitle',
    parent: {
      title: rootSuite,
      project: () => ({ name: rootSuite }),
      allTests: () => [
        { title: 'testTitle', titlePath: () => ['', rootSuite, suiteName, 'testTitle'] },
      ],
      parent: {
        title: rootSuite,
        project: () => ({ name: rootSuite }),
        allTests: () => [
          { title: 'testTitle', titlePath: () => ['', rootSuite, suiteName, 'testTitle'] },
        ],
      },
    },
    titlePath: () => ['', rootSuite, suiteName, 'testTitle'],
    location: {
      file: `C:${path.sep}testProject${path.sep}tests${path.sep}example.js`,
    },
  };

  // TODO: add tests for skipped status and different workerIndex values
  const result = {
    status: 'passed',
  };

  reporter.testItems = new Map([
    [`${rootSuite}/${suiteName}/testTitle`, { id: 'tempTestItemId', name: 'testTitle' }],
  ]);
  reporter.suites = new Map([
    [
      rootSuite,
      {
        id: 'rootsuiteId',
        name: rootSuite,
        testCount: 1,
        descendants: [`${rootSuite}/${suiteName}/testTitle`],
      },
    ],
    [
      `${rootSuite}/${suiteName}`,
      {
        id: 'parentSuiteId',
        name: suiteName,
        testCount: 1,
        descendants: [`${rootSuite}/${suiteName}/testTitle`],
      },
    ],
  ]);

  // @ts-ignore
  reporter.onTestEnd(testParams, result);

  test('client.finishTestItem should be called with suite id', () => {
    expect(reporter.client.finishTestItem).toHaveBeenNthCalledWith(1, 'tempTestItemId', {
      endTime: reporter.client.helpers.now(),
      status: 'passed',
    });
    expect(reporter.client.finishTestItem).toHaveBeenNthCalledWith(2, 'rootsuiteId', {
      endTime: reporter.client.helpers.now(),
    });
    expect(reporter.client.finishTestItem).toHaveBeenNthCalledWith(3, 'parentSuiteId', {
      endTime: reporter.client.helpers.now(),
    });
  });

  test('suites should be reset', () => {
    expect(reporter.suites).toEqual(new Map());
  });
});
