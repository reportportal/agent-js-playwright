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

import { Suite, TestCase } from '@playwright/test/reporter';
import path from 'path';

import { TEST_ITEM_TYPES } from '../../constants';
import { StartTestObjType } from '../../models';
import { RPReporter } from '../../reporter';
import { mockConfig } from '../mocks/configMock';
import { RPClientMock, tempLaunchId } from '../mocks/RPClientMock';

describe('start reporting suite/test', () => {
  const rootSuite = 'tests/example.js';
  const suiteName = 'suiteName';
  const reporter = new RPReporter(mockConfig);
  const testParams = {
    title: 'testTitle',
    parent: {
      title: suiteName,
      location: { file: 'tests/example.js', line: 1, column: 1 },
      tests: [{ title: 'test' } as TestCase],
      project: () => ({ name: '' }),
      allTests: () => [{ title: 'test' } as TestCase],
      titlePath: () => [],
      suites: [],
      parent: {
        title: rootSuite,
        location: { file: 'tests/example.js', line: 1, column: 1 },
        project: () => ({ name: '' }),
        allTests: () => [{ title: 'test' } as TestCase],
        titlePath: () => [],
        suites: [],
      } as Suite,
    } as Suite,
    location: {
      file: `C:${path.sep}testProject${path.sep}tests${path.sep}example.js`,
      line: 5,
      column: 3,
    },
    titlePath: () => ['', rootSuite, suiteName, 'testTitle'],
  } as TestCase;

  beforeAll(() => {
    reporter.client = RPClientMock;
    reporter.launchId = tempLaunchId;
    jest.clearAllMocks();

    jest.spyOn(reporter.client, 'startTestItem');
  });

  test('client.startTestItem should be called with corresponding params to report suites and test item', () => {
    const expectedSuites = new Map([
      [
        rootSuite,
        {
          id: 'tempTestItemId',
          name: rootSuite,
          rootSuite,
          rootSuiteLength: 1,
          testsLength: 1,
        },
      ],
      [
        `${rootSuite}/${suiteName}`,
        {
          id: 'tempTestItemId',
          name: suiteName,
          rootSuite,
          rootSuiteLength: undefined,
          testsLength: 1,
        },
      ],
    ]);
    const expectedTestItems = new Map([
      ['tempTestItemId', { id: 'tempTestItemId', name: 'testTitle', playwrightProjectName: '' }],
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

    reporter.onTestBegin(testParams);

    // the first call for the root suite start
    expect(reporter.client.startTestItem).toHaveBeenNthCalledWith(
      1,
      expectedRootParentSuiteObj,
      reporter.launchId,
      undefined,
    );
    // the first call for the item parent suite start
    expect(reporter.client.startTestItem).toHaveBeenNthCalledWith(
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
    expect(reporter.client.startTestItem).toHaveBeenCalledTimes(3);
    expect(reporter.suites).toEqual(expectedSuites);
    expect(reporter.testItems).toEqual(expectedTestItems);
  });
});
