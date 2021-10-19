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
import { FinishTestItemObjType } from '../../models';

describe('finish test reporting', () => {
  const reporter = new RPReporter(mockConfig);
  reporter.client = new RPClientMock(mockConfig);
  reporter.launchId = 'tempLaunchId';
  reporter.testItems = new Map([['tempTestItemId', { id: 'tempTestItemId', name: 'test' }]]);
  const attributes = [
    {
      key: 'key',
      value: 'value',
    },
  ];

  const description = 'description';

  const testParams = {
    title: 'test',
    parent: {
      title: 'suiteName',
    },
  };

  const result = {
    status: 'skipped',
  };

  const suite = 'tempTestItemId';

  const finishTestItemObj: FinishTestItemObjType = {
    endTime: reporter.client.helpers.now(),
    status: result.status,
    attributes,
    description,
  };
  // @ts-ignore
  reporter.addAttributes(attributes, testParams, suite);
  // @ts-ignore
  reporter.setDescription(description, testParams, suite);

  // @ts-ignore
  reporter.onTestEnd(testParams, result);

  test('client.finishTestItem should be called with suite id', () => {
    expect(reporter.client.finishTestItem).toHaveBeenCalledTimes(1);
    expect(reporter.client.finishTestItem).toHaveBeenCalledWith(
      'tempTestItemId',
      finishTestItemObj,
    );
  });

  test('reporter.testItems size should be 0', () => {
    expect(reporter.testItems.size).toBe(0);
  });
});
