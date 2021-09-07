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
 *
 */

import { mockConfig } from '../mocks/configMock';
import * as utils from '../../utils';
import { promiseErrorHandler } from '../../utils';

describe('testing utils', () => {
  jest.spyOn(utils, 'getConfig').mockImplementation(() => mockConfig);
  const config = utils.getConfig();
  test('getConfig should return config', () => {
    expect(config).toEqual(mockConfig);
  });
  test('promiseErrorHandler', async () => {
    const log = jest.spyOn(console, 'error');
    const promiseWithError = Promise.reject('error message');
    await promiseErrorHandler(promiseWithError, 'Failed to finish suite');

    expect(log).toBeCalledTimes(1);
    expect(log).toBeCalledWith('Failed to finish suite', 'error message');
  });
});