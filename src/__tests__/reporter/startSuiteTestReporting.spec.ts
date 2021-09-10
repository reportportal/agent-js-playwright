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

import RPReporter from '../../reporter';
import { mockConfig } from '../mocks/configMock';
import { RPClientMock } from '../mocks/RPClientMock';
import { StartTestObjType } from '../../models';
import { TEST_ITEM_TYPES } from '../../constants';

describe('start reporting suite/test', () => {
  const reporter = new RPReporter(mockConfig);
  reporter.client = new RPClientMock(mockConfig);
  reporter.launchId = 'tempLaunchId';

  const testParams = {
    title: 'test',
    parent: {
      title: 'suiteName',
    },
  };

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  reporter.onTestBegin(testParams);

  describe('start suite report', () => {
    const expectedSuite = new Map([['suiteName', { id: 'tempTestItemId', name: 'suiteName' }]]);
    const startSuiteObj: StartTestObjType = {
      startTime: reporter.client.helpers.now(),
      name: testParams.parent.title,
      type: TEST_ITEM_TYPES.SUITE,
    };

    test('client.startTestItem should be called with corresponding params', () => {
      expect(reporter.client.startTestItem).toHaveBeenCalledWith(startSuiteObj, reporter.launchId);
    });

    test('reporter.suites should be updated', () => {
      expect(reporter.suites).toEqual(expectedSuite);
    });
  });

  describe('start tests report', () => {
    const expectedTestItems = new Map([['test', { id: 'tempTestItemId', name: 'test' }]]);
    const parentId = 'tempTestItemId';
    const startTestObj: StartTestObjType = {
      startTime: reporter.client.helpers.now(),
      name: testParams.title,
      type: TEST_ITEM_TYPES.STEP,
    };

    test('client.startTestItem should be called with corresponding params', () => {
      expect(reporter.client.startTestItem).toHaveBeenCalledWith(
        startTestObj,
        reporter.launchId,
        parentId,
      );
    });

    test('reporter.testItems should be updated', () => {
      expect(reporter.testItems).toEqual(expectedTestItems);
    });
  });
});

describe('suite in suite case', () => {
  const reporter = new RPReporter(mockConfig);
  reporter.client = new RPClientMock(mockConfig);
  reporter.launchId = 'tempLaunchId';
  const testParams = {
    title: 'test',
    parent: {
      title: 'suiteName',
      parent: {
        title: 'parentSuiteName',
        _isDescribe: true,
      },
    },
  };
  reporter.suites.set('parentSuiteName', { id: 'tempTestItemId', name: 'parentSuiteName' });

  const expectedSuites = new Map([
    [
      'parentSuiteName',
      {
        id: 'tempTestItemId',
        name: 'parentSuiteName',
      },
    ],
    ['suiteName', { id: 'tempTestItemId', name: 'suiteName' }],
  ]);
  test('parent and child suites should be updated', () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    reporter.onTestBegin(testParams);
    expect(reporter.suites).toEqual(expectedSuites);
  });
});
