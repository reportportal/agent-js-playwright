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

describe('finish report suite', () => {
  const reporter = new RPReporter(mockConfig);
  reporter.client = new RPClientMock(mockConfig);
  reporter.launchId = 'tempLaunchId';
  reporter.suites = new Map([['suiteName', { id: 'tempTestItemId', name: 'suiteName' }]]);
  reporter.onEnd();

  test('client.finishTestItem should be called with suite id', () => {
    expect(reporter.client.finishTestItem).toHaveBeenCalledWith('tempTestItemId', {
      endTime: reporter.client.helpers.now(),
    });
  });

  test('suites should be reset', () => {
    expect(reporter.suites).toEqual(new Map());
  });
});
