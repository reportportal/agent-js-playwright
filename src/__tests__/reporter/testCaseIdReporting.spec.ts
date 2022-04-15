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

import { TestCase } from '@playwright/test/reporter';

import { RPReporter } from '../../reporter';
import { mockConfig } from '../mocks/configMock';

describe('testCaseId reporting', () => {
  const suite = 'tempTestItemId';
  const reporter = new RPReporter(mockConfig);
  const testParams = {
    title: 'testName',
  } as TestCase;

  test('reporter.testItems should be updated with testCaseId', () => {
    reporter.testItems = new Map([[suite, { id: suite, name: 'testName' }]]);
    const testCaseId = 'TestCaseIdForTheSuite';
    const expectedTestItems = new Map([[suite, { id: suite, name: 'testName', testCaseId }]]);

    reporter.setTestCaseId(testCaseId, testParams, suite);

    expect(reporter.testItems).toEqual(expectedTestItems);

    reporter.testItems.delete(suite);
  });

  test('reporter.suitesInfo should be with testCaseId', () => {
    reporter.suites = new Map([[suite, { id: suite, name: 'suiteName' }]]);
    const testCaseId = 'TestCaseIdForTheTest';
    const expectedSuitesInfo = new Map([[suite, { testCaseId }]]);

    reporter.setTestCaseId(testCaseId, testParams, suite);

    expect(reporter.suitesInfo).toEqual(expectedSuitesInfo);
  });
});
