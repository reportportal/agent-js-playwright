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

import { ReportingApi } from '../../reportingApi';
import * as utils from '../../utils';

describe('reportingApi', () => {
  test('addAttributes should call sendEventToReporter with params', () => {
    const attrs = [
      {
        key: 'key',
        value: 'value',
      },
    ];
    const suite = 'suite';
    const event = 'rp:addAttributes';
    const spySendEventToReporter = jest.spyOn(utils, 'sendEventToReporter');
    ReportingApi.addAttributes(attrs, suite);

    expect(spySendEventToReporter).toHaveBeenCalledWith(event, attrs, suite);
  });

  test('setDescription should call sendEventToReporter with params', () => {
    const description = 'description';
    const suite = 'suite';
    const event = 'rp:setDescription';
    const spySendEventToReporter = jest.spyOn(utils, 'sendEventToReporter');
    ReportingApi.setDescription(description, suite);

    expect(spySendEventToReporter).toHaveBeenCalledWith(event, description, suite);
  });

  test('setTestCaseId should call sendEventToReporter with params', () => {
    const testCaseId = 'TestCaseIdForTheSuite';
    const suite = 'suite';
    const event = 'rp:setTestCaseId';
    const spySendEventToReporter = jest.spyOn(utils, 'sendEventToReporter');
    ReportingApi.setTestCaseId(testCaseId, suite);

    expect(spySendEventToReporter).toHaveBeenCalledWith(event, testCaseId, suite);
  });
});
