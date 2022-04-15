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

import RPClient from '@reportportal/client-javascript';
import { mocked } from 'jest-mock';

import { mockConfig } from './configMock';

jest.mock('@reportportal/client-javascript');

export const tempLaunchId = 'tempLaunchId';
export const tempTestItemId = 'tempTestItemId';
const mockedDate = Date.now();
const defaultReturnValue = {
  promise: Promise.resolve('ok'),
  tempId: tempLaunchId,
};

export const RPClientMock = mocked<RPClient>(new RPClient(mockConfig, {}), true);

RPClientMock.startLaunch.mockReturnValue({
  promise: Promise.resolve('ok'),
  tempId: tempLaunchId,
});
RPClientMock.finishLaunch.mockReturnValue({
  promise: Promise.resolve('ok'),
  tempId: tempLaunchId,
});
RPClientMock.startTestItem.mockReturnValue({
  promise: Promise.resolve('ok'),
  tempId: tempTestItemId,
});
RPClientMock.finishTestItem.mockReturnValue({
  promise: Promise.resolve('ok'),
  tempId: tempTestItemId,
});
RPClientMock.sendLog.mockReturnValue(defaultReturnValue);
RPClientMock.helpers = { now: (): number => mockedDate } as any;
RPClientMock.checkConnect.mockReturnValue(defaultReturnValue);
