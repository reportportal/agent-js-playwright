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
import { RPClientMock } from '../mocks/RPClientMock';

describe('onStdOut testing', () => {
  const reporter = new RPReporter(mockConfig);
  reporter.client = new RPClientMock(mockConfig);
  const testCase = <TestCase>{
    title: 'testTitle',
    id: 'testItemId',
    titlePath: () => ['rootSuite', 'suiteName', 'testTitle'],
  };

  test('case stdOut logs', () => {
    jest.spyOn(reporter, 'sendTestItemLog');
    // @ts-ignore
    reporter.onStdOut('Some logs', testCase);
    expect(reporter.sendTestItemLog).toHaveBeenCalledWith({ message: 'Some logs' }, testCase);
  });
});
