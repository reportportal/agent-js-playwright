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

import { LOG_LEVELS } from '../../constants';
import { RPReporter } from '../../reporter';
import { mockConfig } from '../mocks/configMock';
import { RPClientMock } from '../mocks/RPClientMock';

describe('Reporter.onStdErr', () => {
  const reporter = new RPReporter(mockConfig);

  beforeAll(() => {
    reporter.client = RPClientMock;

    jest.clearAllMocks();
    jest.spyOn(reporter, 'sendTestItemLog');
  });

  test('should call sendTestItemLog with LOG_LEVELS.ERROR', () => {
    const test = {
      title: 'some test',
    } as TestCase;

    reporter.onStdErr('Some error log', test);

    expect(reporter.sendTestItemLog).toHaveBeenCalledWith(
      { level: LOG_LEVELS.ERROR, message: 'Some error log' },
      test,
    );
  });

  test('should call sendTestItemLog with LOG_LEVELS.WARN', () => {
    const test = {
      title: 'some test',
    } as TestCase;

    reporter.onStdErr('Some warn message', test);

    expect(reporter.sendTestItemLog).toHaveBeenCalledWith(
      { level: LOG_LEVELS.WARN, message: 'Some warn message' },
      test,
    );
  });
});
