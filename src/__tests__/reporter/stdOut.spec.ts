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

describe('stdOut testing', () => {
  const reporter = new RPReporter(mockConfig);
  reporter.client = new RPClientMock(mockConfig);

  test('case rp:addAttributes should call addAttributes', () => {
    const type = 'rp:addAttributes';
    const data = [
      {
        key: 'key',
        value: 'value',
      },
    ];
    jest.spyOn(reporter, 'addAttributes');
    const chunk = JSON.stringify({ type, data });
    reporter.onStdOut(chunk);
    expect(reporter.addAttributes).toHaveBeenCalled();
  });
});
