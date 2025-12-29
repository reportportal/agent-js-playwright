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

import helpers from '@reportportal/client-javascript/lib/helpers';
import { RPReporter } from '../../reporter';
import { StartLaunchObjType } from '../../models';
import { LAUNCH_MODES } from '../../constants';
import { getSystemAttribute } from '../../utils';

import { mockConfig } from '../mocks/configMock';
import { RPClientMock, mockedDate } from '../mocks/RPClientMock';

describe('start launch', () => {
  jest.spyOn(helpers, 'now').mockReturnValue(mockedDate);

  describe('DEFAULT mode', () => {
    const reporter = new RPReporter(mockConfig);
    reporter.client = new RPClientMock(mockConfig);
    const startLaunchObj: StartLaunchObjType = {
      name: mockConfig.launch,
      startTime: mockedDate,
      attributes: [...(mockConfig.attributes || []), getSystemAttribute()],
      description: mockConfig.description,
      mode: LAUNCH_MODES.DEFAULT,
    };

    beforeAll(() => reporter.onBegin());

    test('client.startLaunch should be called with corresponding params', () => {
      expect(reporter.client.startLaunch).toHaveBeenCalledTimes(1);
      expect(reporter.client.startLaunch).toHaveBeenCalledWith(startLaunchObj);
    });

    test('reporter.launchId should be set', () => {
      expect(reporter.launchId).toEqual('tempLaunchId');
    });
  });

  describe('DEBUG mode', () => {
    const customConfig = {
      ...mockConfig,
      mode: LAUNCH_MODES.DEBUG,
    };
    const reporter = new RPReporter(customConfig);
    reporter.client = new RPClientMock(customConfig);
    const startLaunchObj: StartLaunchObjType = {
      name: customConfig.launch,
      startTime: mockedDate,
      attributes: [...(customConfig.attributes || []), getSystemAttribute()],
      description: customConfig.description,
      mode: customConfig.mode,
    };

    beforeAll(() => reporter.onBegin());

    test('client.startLaunch should be called with corresponding params', () => {
      expect(reporter.client.startLaunch).toHaveBeenCalledTimes(1);
      expect(reporter.client.startLaunch).toHaveBeenCalledWith(startLaunchObj);
    });

    test('reporter.launchId should be set', () => {
      expect(reporter.launchId).toEqual('tempLaunchId');
    });
  });

  describe('with existing launch id in config', () => {
    const customConfig = {
      ...mockConfig,
      launchId: 'id',
    };
    const reporter = new RPReporter(customConfig);
    reporter.client = new RPClientMock(customConfig);
    const startLaunchObj: StartLaunchObjType = {
      name: customConfig.launch,
      startTime: mockedDate,
      attributes: [...(customConfig.attributes || []), getSystemAttribute()],
      description: customConfig.description,
      mode: LAUNCH_MODES.DEFAULT,
      id: 'id',
    };

    beforeAll(() => reporter.onBegin());

    test('client.startLaunch should be called with corresponding params', () => {
      expect(reporter.client.startLaunch).toHaveBeenCalledTimes(1);
      expect(reporter.client.startLaunch).toHaveBeenCalledWith(startLaunchObj);
    });

    test('reporter.launchId should be set', () => {
      expect(reporter.launchId).toEqual('tempLaunchId');
    });
  });

  describe('with existing launch id provided by ENV variable', () => {
    let reporter: RPReporter;
    const startLaunchObj: StartLaunchObjType = {
      name: mockConfig.launch,
      startTime: mockedDate,
      attributes: [...(mockConfig.attributes || []), getSystemAttribute()],
      description: mockConfig.description,
      mode: LAUNCH_MODES.DEFAULT,
      id: 'id',
    };

    beforeAll(() => {
      process.env.RP_LAUNCH_ID = 'id';
      reporter = new RPReporter(mockConfig);
      reporter.client = new RPClientMock(mockConfig);

      reporter.onBegin();
    });

    afterAll(() => {
      delete process.env.RP_LAUNCH_ID;
    });

    test('client.startLaunch should be called with corresponding params', () => {
      expect(reporter.client.startLaunch).toHaveBeenCalledTimes(1);
      expect(reporter.client.startLaunch).toHaveBeenCalledWith(startLaunchObj);
    });

    test('reporter.launchId should be set', () => {
      expect(reporter.launchId).toEqual('tempLaunchId');
    });
  });
});

describe('finish launch', () => {
  describe('without existing launch id in config', () => {
    const reporter = new RPReporter(mockConfig);
    reporter.client = new RPClientMock(mockConfig);
    reporter.launchId = 'tempLaunchId';

    beforeAll(() => reporter.onEnd());

    test('launch should be finished', () => {
      expect(reporter.client.finishLaunch).toHaveBeenCalledTimes(1);
      expect(reporter.client.finishLaunch).toHaveBeenCalledWith('tempLaunchId', {
        endTime: mockedDate,
      });
      expect(reporter.isLaunchFinishSend).toBe(true);
    });
  });

  describe('with existing launch id in config', () => {
    const customConfig = {
      ...mockConfig,
      launchId: 'id',
    };
    const reporter = new RPReporter(customConfig);
    reporter.client = new RPClientMock(customConfig);
    reporter.launchId = 'tempLaunchId';

    beforeAll(() => reporter.onEnd());

    test('launch finish request should not be sent', () => {
      expect(reporter.client.finishLaunch).toHaveBeenCalledTimes(0);
      expect(reporter.isLaunchFinishSend).toBe(true);
    });
  });

  describe('with existing launch id provided by ENV variable', () => {
    let reporter: RPReporter;

    beforeAll(() => {
      process.env.RP_LAUNCH_ID = 'id';
      reporter = new RPReporter(mockConfig);
      reporter.client = new RPClientMock(mockConfig);
      reporter.launchId = 'tempLaunchId';

      reporter.onEnd();
    });

    afterAll(() => {
      delete process.env.RP_LAUNCH_ID;
    });

    test('launch finish request should not be sent', () => {
      expect(reporter.client.finishLaunch).toHaveBeenCalledTimes(0);
      expect(reporter.isLaunchFinishSend).toBe(true);
    });
  });
});
