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

describe('testCaseId reporting', () => {
  const reporter = new RPReporter(mockConfig);
  reporter.client = new RPClientMock(mockConfig);

  const testParams = {
    title: 'testTitle',
    titlePath: () => ['', suiteName, 'testTitle'],
  };

  test('reporter.testItems should be updated with testCaseId', () => {
    reporter.testItems = new Map([
      [`${suiteName}/testTitle`, { id: 'tempTestItemId', name: 'testTitle' }],
    ]);
    const testCaseId = 'TestCaseIdForTheTestItem';
    // @ts-ignore
    reporter.setTestCaseId(testCaseId, testParams);
    const expectedTestItems = new Map([
      [`${suiteName}/testTitle`, { id: 'tempTestItemId', name: 'testTitle', testCaseId }],
    ]);
    expect(reporter.testItems).toEqual(expectedTestItems);
  });

  test('reporter.suitesInfo should be with testCaseId', () => {
    const testCaseId = 'TestCaseIdForTheSuite';
    // @ts-ignore
    reporter.setTestCaseId(testCaseId, testParams, suiteName);
    const expectedSuitesInfo = new Map([[suiteName, { testCaseId }]]);
    expect(reporter.suitesInfo).toEqual(expectedSuitesInfo);
  });
});
