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

describe('Reporter.onStdOut', () => {
  const reporter = new RPReporter(mockConfig);

  beforeAll(() => {
    reporter.client = RPClientMock;

    jest.clearAllMocks();
    jest.spyOn(reporter, 'sendTestItemLog');
  });

  test('should call addAttributes on rp:addAttributes', () => {
    const type = 'rp:addAttributes';
    const data = [
      {
        key: 'key',
        value: 'value',
      },
    ];
    const chunk = JSON.stringify({ type, data });
    jest.spyOn(reporter, 'addAttributes');

    reporter.onStdOut(chunk);

    expect(reporter.addAttributes).toHaveBeenCalled();
  });

  test('should call setDescription on rp:setDescription', () => {
    const type = 'rp:setDescription';
    const data = 'Description';
    const chunk = JSON.stringify({ type, data });
    jest.spyOn(reporter, 'setDescription');

    reporter.onStdOut(chunk);

    expect(reporter.setDescription).toHaveBeenCalled();
  });

  test('should call setTestCaseId on rp:setTestCaseId', () => {
    const type = 'rp:setTestCaseId';
    const data = 'TestCaseIdForTheSuite';
    const chunk = JSON.stringify({ type, data });
    jest.spyOn(reporter, 'setTestCaseId');

    reporter.onStdOut(chunk);

    expect(reporter.setTestCaseId).toHaveBeenCalled();
  });

  test('should call setStatus on rp:setStatus', () => {
    const type = 'rp:setStatus';
    const data = 'status';
    const chunk = JSON.stringify({ type, data });
    jest.spyOn(reporter, 'setStatus');

    reporter.onStdOut(chunk);

    expect(reporter.setStatus).toHaveBeenCalled();
  });

  test('should call setLaunchStatus on rp:setLaunchStatus', () => {
    const type = 'rp:setLaunchStatus';
    const data = 'statusForLaunch';
    const chunk = JSON.stringify({ type, data });
    jest.spyOn(reporter, 'setLaunchStatus');

    reporter.onStdOut(chunk);

    expect(reporter.setLaunchStatus).toHaveBeenCalled();
  });

  test('should call sendTestItemLog on rp:addLog', () => {
    const type = 'rp:addLog';
    const data = {
      level: 'INFO',
      message: 'info log',
    };
    const chunk = JSON.stringify({ type, data });

    reporter.onStdOut(chunk);

    expect(reporter.sendTestItemLog).toHaveBeenCalled();
  });

  test('should call sendLaunchLog on rp:addLaunchLog', () => {
    const type = 'rp:addLaunchLog';
    const data = {
      level: 'INFO',
      message: 'info log',
    };
    const chunk = JSON.stringify({ type, data });
    jest.spyOn(reporter, 'sendLaunchLog');

    reporter.onStdOut(chunk);

    expect(reporter.sendLaunchLog).toHaveBeenCalled();
  });

  test('case stdOut logs', () => {
    const test = {
      title: 'some test',
    } as TestCase;

    reporter.onStdOut('Some logs', test);

    expect(reporter.sendTestItemLog).toHaveBeenCalledWith({ message: 'Some logs' }, test);
  });
});
