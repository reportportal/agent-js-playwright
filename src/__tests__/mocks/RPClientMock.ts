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

import { ReportPortalConfig } from '../../models';

const mockedDate = Date.now();
export const mockedTestItems = new Map([['test', { id: 'tempTestItemId', name: 'test' }]]);
export const mockedTestParams = {
  title: 'test',
  parent: {
    title: 'suiteName',
  },
  // location: '', titlePath, expectedStatus, timeout
};
export const mockedResult = {
  status: 'passed',
};

export class RPClientMock {
  private config: ReportPortalConfig;

  constructor(config?: ReportPortalConfig) {
    this.config = config;
  }

  public startLaunch = jest.fn().mockReturnValue({
    promise: Promise.resolve('ok'),
    tempId: 'tempLaunchId',
  });

  public finishLaunch = jest.fn().mockReturnValue({
    promise: Promise.resolve('ok'),
  });

  public startTestItem = jest.fn().mockReturnValue({
    promise: Promise.resolve('ok'),
    tempId: 'tempTestItemId',
  });

  public finishTestItem = jest.fn().mockReturnValue({
    promise: Promise.resolve('ok'),
  });

  public sendLog = jest.fn().mockReturnValue({
    promise: Promise.resolve('ok'),
  });

  public helpers = {
    now: (): number => mockedDate,
  };

  public checkConnect = jest.fn().mockReturnValue({
    promise: Promise.resolve('ok'),
  });
}
