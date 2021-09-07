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

import MyReporter from '../../reporter';
import { mockConfig } from '../mocks/configMock';
import { RPClientMock } from '../mocks/RPClientMock';
import { StartTestObjType } from '../../models';
import { TEST_ITEM_TYPES } from '../../constants';
import { utils } from '../../utils';

describe('start report suite', () => {
  jest.spyOn(utils, 'getConfig').mockImplementation(() => mockConfig);
  const reporter = new MyReporter();
  reporter.client = new RPClientMock(mockConfig);
  reporter.launchId = 'tempLaunchId';
  const testParams = {
    title: 'test',
    parent: {
      title: 'suiteName',
    },
  };

  const startSuiteObj: StartTestObjType = {
    startTime: reporter.client.helpers.now(),
    name: testParams.parent.title,
    type: TEST_ITEM_TYPES.SUITE,
  };

  const spyOnTestBegin = jest.spyOn(reporter, 'onTestBegin');

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  reporter.onTestBegin(testParams);

  const expectedSuite = new Map([['suiteName', { id: 'tempTestItemId', name: 'suiteName' }]]);

  test('client.startTestItem should be called with corresponding params', () => {
    expect(spyOnTestBegin).toHaveBeenCalledTimes(1);
    expect(reporter.client.startTestItem).toHaveBeenCalledWith(startSuiteObj, reporter.launchId);
  });

  test('reporter.suites should be updated', () => {
    expect(reporter.suites).toEqual(expectedSuite);
  });
});

describe('finish report suite', () => {
  const reporter = new MyReporter();
  reporter.client = new RPClientMock(mockConfig);
  reporter.launchId = 'tempLaunchId';
  reporter.suites = new Map([['suiteName', { id: 'tempTestItemId', name: 'suiteName' }]]);
  reporter.onEnd();

  test('client.finishTestItem should be called with suite id', () => {
    expect(reporter.client.finishTestItem).toHaveBeenCalledWith('tempTestItemId', {
      endTime: reporter.client.helpers.now(),
    });
  });

  test('suites should be reset', () => {
    expect(reporter.suites).toEqual(new Map());
  });
});
