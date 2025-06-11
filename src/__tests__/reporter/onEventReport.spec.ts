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

describe('onEventReport testing', () => {
  const reporter = new RPReporter(mockConfig);
  reporter.client = new RPClientMock(mockConfig);
  const testCase = <TestCase>{
    title: 'testTitle',
    id: 'testItemId',
    titlePath: () => ['rootSuite', 'suiteName', 'testTitle'],
  };

  test('case rp:addAttributes should call addAttributes', () => {
    const suiteName = 'suiteName';
    const type = 'rp:addAttributes';
    const data = [
      {
        key: 'key',
        value: 'value',
      },
    ];
    jest.spyOn(reporter, 'addAttributes');
    const dataToReport = { type, data, suiteName };
    reporter.onEventReport(dataToReport, testCase);
    expect(reporter.addAttributes).toHaveBeenCalledWith(data, testCase, suiteName);
  });

  test('case rp:setDescription should call setDescription', () => {
    const suiteName = 'suiteName';
    const type = 'rp:setDescription';
    const data = 'Description';
    jest.spyOn(reporter, 'setDescription');
    const dataToReport = { type, data, suiteName };
    reporter.onEventReport(dataToReport, testCase);
    expect(reporter.setDescription).toHaveBeenCalledWith(data, testCase, suiteName);
  });

  test('case rp:setTestCaseId should call setTestCaseId', () => {
    const suiteName = 'suiteName';
    const type = 'rp:setTestCaseId';
    const data = 'TestCaseIdForTheSuite';
    jest.spyOn(reporter, 'setTestCaseId');
    const dataToReport = { type, data, suiteName };
    reporter.onEventReport(dataToReport, testCase);
    expect(reporter.setTestCaseId).toHaveBeenCalledWith(data, testCase, suiteName);
  });

  test('case rp:setStatus should call setStatus', () => {
    const suiteName = 'suiteName';
    const type = 'rp:setStatus';
    const data = 'status';
    jest.spyOn(reporter, 'setStatus');
    const dataToReport = { type, data, suiteName };
    reporter.onEventReport(dataToReport, testCase);
    expect(reporter.setStatus).toHaveBeenCalledWith(data, testCase, suiteName);
  });

  test('case rp:setLaunchStatus should call setLaunchStatus', () => {
    const suiteName = 'suiteName';
    const type = 'rp:setLaunchStatus';
    const data = 'statusForLaunch';
    jest.spyOn(reporter, 'setLaunchStatus');
    const dataToReport = { type, data, suiteName };
    reporter.onEventReport(dataToReport, testCase);
    expect(reporter.setLaunchStatus).toHaveBeenCalledWith(data);
  });

  test('case rp:addLog should call sendTestItemLog', () => {
    const suiteName = 'suiteName';
    const type = 'rp:addLog';
    const data = {
      level: 'INFO',
      message: 'info log',
    };
    jest.spyOn(reporter, 'sendTestItemLog');
    const dataToReport = { type, data, suiteName };
    reporter.onEventReport(dataToReport, testCase);
    expect(reporter.sendTestItemLog).toHaveBeenCalledWith(data, testCase, suiteName);
  });

  test('case rp:addLaunchLog should call sendLaunchLog', () => {
    const suiteName = 'suiteName';
    const type = 'rp:addLaunchLog';
    const data = {
      level: 'INFO',
      message: 'info log',
    };
    jest.spyOn(reporter, 'sendLaunchLog');
    const dataToReport = { type, data, suiteName };
    reporter.onEventReport(dataToReport, testCase);
    expect(reporter.sendLaunchLog).toHaveBeenCalledWith(data);
  });
});
