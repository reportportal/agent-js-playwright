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

import helpers from '@reportportal/client-javascript/lib/helpers';
import { RPReporter } from '../../reporter';
import { mockConfig } from '../mocks/configMock';
import { RPClientMock, mockedDate } from '../mocks/RPClientMock';
import { StartTestObjType } from '../../models';
import { TEST_ITEM_TYPES } from '../../constants';

describe('retries reporting', () => {
  jest.spyOn(helpers, 'now').mockReturnValue(mockedDate);
  const reporter = new RPReporter(mockConfig);
  reporter.client = new RPClientMock(mockConfig);

  const testCase = {
    title: 'testTitle',
    id: 'testItemId',
    parent: {
      title: 'suiteName',
      location: 'tests/example.js',
      project: () => ({ name: '' }),
    },
    titlePath: () => ['suiteName', 'testTitle'],
    results: [{}, {}],
  };

  const spyStartTestItem = jest.spyOn(reporter.client, 'startTestItem');

  test('client.startTestItem should be called with retry=true params', () => {
    const parentId = 'tempTestItemId';
    const expectedTestObj: StartTestObjType = {
      startTime: mockedDate,
      name: 'testTitle',
      type: TEST_ITEM_TYPES.STEP,
      codeRef: 'suiteName/testTitle',
      retry: true,
    };
    reporter.suites = new Map([['suiteName', { id: 'tempTestItemId', name: 'suiteName' }]]);

    // @ts-ignore
    reporter.onTestBegin(testCase);

    expect(spyStartTestItem).toHaveBeenCalledWith(expectedTestObj, reporter.launchId, parentId);
  });
});
