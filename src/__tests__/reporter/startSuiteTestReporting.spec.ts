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
import { StartTestObjType } from '../../models';
import { TEST_ITEM_TYPES } from '../../constants';
import path from 'path';

const rootSuite = 'tests/example.js';
const suiteName = 'suiteName';

describe('start reporting suite/test', () => {
  let reporter: RPReporter;
  let spyStartTestItem: jest.SpyInstance;

  const testCase = {
    title: 'testTitle',
    id: 'testItemId',
    parent: {
      title: suiteName,
      location: 'tests/example.js',
      project: () => ({ name: '' }),
      allTests: () => [
        {
          id: 'testItemId',
          title: 'testTitle',
          titlePath: () => ['', rootSuite, suiteName, 'testTitle'],
        },
      ],
      parent: {
        title: rootSuite,
        location: 'tests/example.js',
        project: () => ({ name: '' }),
        allTests: () => [
          {
            id: 'testItemId',
            title: 'testTitle',
            titlePath: () => ['', rootSuite, suiteName, 'testTitle'],
          },
        ],
      },
    },
    location: {
      file: `C:${path.sep}testProject${path.sep}tests${path.sep}example.js`,
      line: 5,
      column: 3,
    },
    titlePath: () => ['', rootSuite, suiteName, 'testTitle'],
  };

  beforeEach(() => {
    reporter = new RPReporter(mockConfig);
    reporter.client = new RPClientMock(mockConfig);
    reporter.launchId = 'tempLaunchId';

    spyStartTestItem = jest.spyOn(reporter.client, 'startTestItem');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('client.startTestItem should be called with corresponding params to report suites and test item', () => {
    const expectedSuites = new Map([
      [
        rootSuite,
        {
          id: 'tempTestItemId',
          name: rootSuite,
          testInvocationsLeft: 1,
          descendants: ['testItemId'],
        },
      ],
      [
        `${rootSuite}/${suiteName}`,
        {
          id: 'tempTestItemId',
          name: suiteName,
          descendants: ['testItemId'],
          testInvocationsLeft: 1,
        },
      ],
    ]);
    const expectedTestItems = new Map([
      ['testItemId', { id: 'tempTestItemId', name: 'testTitle' }],
    ]);
    const expectedRootParentSuiteObj: StartTestObjType = {
      startTime: reporter.client.helpers.now(),
      name: rootSuite,
      type: TEST_ITEM_TYPES.SUITE,
      codeRef: 'tests/example.js',
    };
    const expectedParentSuiteObj: StartTestObjType = {
      startTime: reporter.client.helpers.now(),
      name: suiteName,
      type: TEST_ITEM_TYPES.TEST,
      codeRef: 'tests/example.js/suiteName',
    };
    const expectedTestObj: StartTestObjType = {
      startTime: reporter.client.helpers.now(),
      name: 'testTitle',
      type: TEST_ITEM_TYPES.STEP,
      codeRef: 'tests/example.js/suiteName/testTitle',
      retry: false,
    };
    const parentId = 'tempTestItemId';

    // @ts-ignore
    reporter.onTestBegin(testCase);

    // the first call for the root suite start
    expect(spyStartTestItem).toHaveBeenNthCalledWith(
      1,
      expectedRootParentSuiteObj,
      reporter.launchId,
      undefined,
    );
    // the first call for the item parent suite start
    expect(spyStartTestItem).toHaveBeenNthCalledWith(
      2,
      expectedParentSuiteObj,
      reporter.launchId,
      parentId,
    );
    // the third call for the test item start
    expect(reporter.client.startTestItem).toHaveBeenNthCalledWith(
      3,
      expectedTestObj,
      reporter.launchId,
      parentId,
    );
    expect(spyStartTestItem).toHaveBeenCalledTimes(3);
    expect(reporter.suites).toEqual(expectedSuites);
    expect(reporter.testItems).toEqual(expectedTestItems);
  });

  test('client.startTestItem should not be called in case of launch finish request have been send', () => {
    reporter.isLaunchFinishSend = true;
    // @ts-ignore
    reporter.onTestBegin(testCase);

    expect(spyStartTestItem).toHaveBeenCalledTimes(0);
    expect(reporter.suites).toEqual(new Map());
    expect(reporter.testItems).toEqual(new Map());
  });
});
