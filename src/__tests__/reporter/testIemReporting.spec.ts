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
import { config } from '../mocks/configMock';
import { mockedResult, mockedTestParams, RPClientMock } from '../mocks/RPClientMock';
import { FinishTestItemObjType, StartTestObjType } from '../../models';
import { TEST_ITEM_TYPES } from '../../constants';

describe('start test reporting', () => {
  const reporter = new MyReporter(config);
  reporter.client = new RPClientMock(config);
  reporter.launchId = 'tempLaunchId';
  const parentId = 'tempTestItemId';
  const startTestObj: StartTestObjType = {
    startTime: reporter.client.helpers.now(),
    name: mockedTestParams.title,
    type: TEST_ITEM_TYPES.STEP,
  };
  const mockedTestItems = new Map([['test', { id: 'tempTestItemId', name: 'test' }]]);
  const spyOnTestBegin = jest.spyOn(reporter, 'onTestBegin');
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  reporter.onTestBegin(mockedTestParams);

  test('client.startTestItem should be called with corresponding params', () => {
    expect(spyOnTestBegin).toHaveBeenCalledTimes(1);
    expect(reporter.client.startTestItem).toHaveBeenCalledWith(
      startTestObj,
      reporter.launchId,
      parentId,
    );
  });

  test('reporter.testItems should be updated', () => {
    expect(reporter.testItems).toEqual(mockedTestItems);
  });
});

describe('finish test reporting', () => {
  const reporter = new MyReporter(config);
  reporter.client = new RPClientMock(config);
  reporter.launchId = 'tempLaunchId';
  reporter.testItems = new Map([['test', { id: 'tempTestItemId', name: 'test' }]]);
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  reporter.onTestEnd(mockedTestParams, mockedResult);

  const finishTestItemObj: FinishTestItemObjType = {
    endTime: reporter.client.helpers.now(),
    status: mockedResult.status,
  };

  const expectedTestItemsSize = new Map([['test', { id: 'tempTestItemId', name: 'test' }]]).size;

  test('client.finishTestItem should be called with suite id', () => {
    expect(reporter.client.finishTestItem).toHaveBeenCalledWith(
      'tempTestItemId',
      finishTestItemObj,
    );
  });

  test('testItems size should be less than mocked', () => {
    expect(reporter.testItems.size).toBeLessThan(expectedTestItemsSize);
  });
});
