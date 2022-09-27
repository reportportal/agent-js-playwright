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

const suiteName = 'suiteName';

describe('description reporting', () => {
  const reporter = new RPReporter(mockConfig);
  reporter.client = new RPClientMock(mockConfig);

  const description = 'Description';

  const testParams = {
    title: 'testTitle',
    titlePath: () => ['', suiteName, 'testTitle'],
  };

  test('reporter.testItems should be updated with description', () => {
    reporter.testItems = new Map([
      [`${suiteName}/testTitle`, { id: 'tempTestItemId', name: 'testTitle' }],
    ]);
    // @ts-ignore
    reporter.setDescription(description, testParams);
    const expectedTestItems = new Map([
      [`${suiteName}/testTitle`, { id: 'tempTestItemId', name: 'testTitle', description }],
    ]);
    expect(reporter.testItems).toEqual(expectedTestItems);
  });

  test('reporter.suitesInfo should be with description', () => {
    // @ts-ignore
    reporter.setDescription(description, testParams, suiteName);
    const expectedSuitesInfo = new Map([[suiteName, { description }]]);
    expect(reporter.suitesInfo).toEqual(expectedSuitesInfo);
  });
});
