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

import { LAUNCH_MODES } from '../../constants';
import { StartLaunchObjType } from '../../models';
import { RPReporter } from '../../reporter';
import { getSystemAttributes } from '../../utils';
import { mockConfig } from '../mocks/configMock';
import { RPClientMock, tempLaunchId } from '../mocks/RPClientMock';

describe('start report launch', () => {
  describe('DEFAULT mode', () => {
    const reporter = new RPReporter(mockConfig);
    reporter.client = RPClientMock;
    const startLaunchObj: StartLaunchObjType = {
      name: mockConfig.launch,
      startTime: reporter.client.helpers.now(),
      attributes: getSystemAttributes(),
      description: mockConfig.description,
      mode: LAUNCH_MODES.DEFAULT,
    };

    beforeAll(() => {
      jest.clearAllMocks();
      reporter.onBegin();
    });

    test('client.startLaunch should be called with corresponding params', () => {
      expect(reporter.client.startLaunch).toHaveBeenCalledTimes(1);
      expect(reporter.client.startLaunch).toHaveBeenCalledWith(startLaunchObj);
    });

    test('reporter.launchId should be set', () => {
      expect(reporter.launchId).toEqual(tempLaunchId);
    });
  });

  describe('DEBUG mode', () => {
    const customConfig = {
      ...mockConfig,
      mode: LAUNCH_MODES.DEBUG,
    };
    const reporter = new RPReporter(customConfig);
    reporter.client = RPClientMock;
    const startLaunchObj: StartLaunchObjType = {
      name: customConfig.launch,
      startTime: reporter.client.helpers.now(),
      attributes: getSystemAttributes(),
      description: customConfig.description,
      mode: customConfig.mode,
    };

    beforeAll(() => {
      jest.clearAllMocks();
      reporter.onBegin();
    });

    test('should allow to pass mode to startLaunch', () => {
      expect(reporter.client.startLaunch).toHaveBeenCalledTimes(1);
      expect(reporter.client.startLaunch).toHaveBeenCalledWith(startLaunchObj);
    });

    test('reporter.launchId should be set', () => {
      expect(reporter.launchId).toEqual(tempLaunchId);
    });
  });
});

describe('finish report launch', () => {
  const reporter = new RPReporter(mockConfig);
  reporter.client = RPClientMock;
  reporter.launchId = tempLaunchId;

  beforeAll(() => {
    jest.clearAllMocks();
    reporter.onEnd();
  });

  test('launch should be finished', () => {
    expect(reporter.client.finishLaunch).toHaveBeenCalledTimes(1);
    expect(reporter.client.finishLaunch).toHaveBeenCalledWith(tempLaunchId, {
      endTime: reporter.client.helpers.now(),
    });
  });
});
