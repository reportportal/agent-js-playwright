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
import { mockedResult, mockedTestParams, RPClientMock } from '../mocks/RPClientMock';
import { FinishTestItemObjType } from '../../models';

describe('finish test reporting', () => {
  const reporter = new RPReporter(mockConfig);
  reporter.client = new RPClientMock(mockConfig);
  reporter.launchId = 'tempLaunchId';
  reporter.testItems = new Map([['test', { id: 'tempTestItemId', name: 'test' }]]);

  const finishTestItemObj: FinishTestItemObjType = {
    endTime: reporter.client.helpers.now(),
    status: mockedResult.status,
  };

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  reporter.onTestEnd(mockedTestParams, mockedResult);

  test('client.finishTestItem should be called with suite id', () => {
    expect(reporter.client.finishTestItem).toHaveBeenCalledTimes(1);
    expect(reporter.client.finishTestItem).toHaveBeenCalledWith(
      'tempTestItemId',
      finishTestItemObj,
    );
  });

  test('testItems size should be less than mocked', () => {
    expect(reporter.testItems.size).toBeLessThan(1);
  });
});
