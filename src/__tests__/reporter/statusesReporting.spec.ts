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

import { STATUSES } from '../../constants';
import { RPReporter } from '../../reporter';
import { mockConfig } from '../mocks/configMock';

describe('statuses reporting', () => {
  const reporter = new RPReporter(mockConfig);
  const testParams = {
    title: 'testName',
  } as TestCase;
  const suite = 'tempTestItemId';

  test('reporter.testItems should be updated with statuses', () => {
    reporter.testItems = new Map([['tempTestItemId', { id: 'tempTestItemId', name: 'testName' }]]);
    const status = STATUSES.PASSED;
    const expectedTestItems = new Map([
      ['tempTestItemId', { id: 'tempTestItemId', name: 'testName', status }],
    ]);

    reporter.setStatus(status, testParams, suite);

    expect(reporter.testItems).toEqual(expectedTestItems);

    reporter.testItems.delete('tempTestItemId');
  });

  test('reporter.suitesInfo should be with statuses', () => {
    reporter.suites = new Map([['tempTestItemId', { id: 'tempTestItemId', name: 'suiteName' }]]);
    const status = STATUSES.PASSED;
    const expectedSuitesInfo = new Map([['tempTestItemId', { status }]]);

    reporter.setStatus(status, testParams, suite);

    expect(reporter.suitesInfo).toEqual(expectedSuitesInfo);
  });

  test('reporter.customLaunchStatus should be updated with status', () => {
    const status = STATUSES.PASSED;
    reporter.setLaunchStatus(status);

    expect(reporter.customLaunchStatus).toBe(status);
  });
});
