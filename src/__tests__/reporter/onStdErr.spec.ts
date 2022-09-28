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
import { LOG_LEVELS } from '../../constants';

describe('onStdErr testing', () => {
  const reporter = new RPReporter(mockConfig);
  reporter.client = new RPClientMock(mockConfig);
  const testCase = {
    title: 'testTitle',
    titlePath: () => ['rootSuite', 'suiteName', 'testTitle'],
  };

  test('onStdErr call sendTestItemLog with LOG_LEVELS.ERROR', () => {
    jest.spyOn(reporter, 'sendTestItemLog');
    // @ts-ignore
    reporter.onStdErr('Some error log', testCase);
    expect(reporter.sendTestItemLog).toHaveBeenCalledWith(
      { level: LOG_LEVELS.ERROR, message: 'Some error log' },
      testCase,
    );
  });

  test('onStdErr call sendTestItemLog with LOG_LEVELS.WARN', () => {
    jest.spyOn(reporter, 'sendTestItemLog');
    // @ts-ignore
    reporter.onStdErr('Some warn message', testCase);
    expect(reporter.sendTestItemLog).toHaveBeenCalledWith(
      { level: LOG_LEVELS.WARN, message: 'Some warn message' },
      testCase,
    );
  });
});
