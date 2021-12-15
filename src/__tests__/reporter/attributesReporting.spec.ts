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

describe('attributes reporting', () => {
  const reporter = new RPReporter(mockConfig);
  reporter.client = new RPClientMock(mockConfig);

  const attributes = [
    {
      key: 'key',
      value: 'value',
    },
  ];

  const testParams = {
    title: 'testName',
  };

  const suite = 'tempTestItemId';

  test('reporter.testItems should be updated with attributes', () => {
    reporter.testItems = new Map([['tempTestItemId', { id: 'tempTestItemId', name: 'testName' }]]);
    // @ts-ignore
    reporter.addAttributes(attributes, testParams, suite);
    const expectedTestItems = new Map([
      ['tempTestItemId', { id: 'tempTestItemId', name: 'testName', attributes }],
    ]);
    expect(reporter.testItems).toEqual(expectedTestItems);
    reporter.testItems.delete('tempTestItemId');
  });

  test('reporter.suitesInfo should be with attributes', () => {
    reporter.suites = new Map([['tempTestItemId', { id: 'tempTestItemId', name: 'suiteName' }]]);
    // @ts-ignore
    reporter.addAttributes(attributes, testParams, suite);
    const expectedSuitesInfo = new Map([
      [
        'tempTestItemId',
        {
          attributes: [
            {
              key: 'key',
              value: 'value',
            },
          ],
        },
      ],
    ]);
    expect(reporter.suitesInfo).toEqual(expectedSuitesInfo);
  });
});
