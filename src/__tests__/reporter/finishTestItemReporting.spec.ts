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

import helpers from '@reportportal/client-javascript/lib/helpers';
import { RPReporter } from '../../reporter';
import { mockConfig } from '../mocks/configMock';
import { RPClientMock, mockedDate } from '../mocks/RPClientMock';
import { FinishTestItemObjType } from '../../models';
import { STATUSES } from '../../constants';
import * as utils from '../../utils';

const rootSuite = 'rootSuite';
const suiteName = 'suiteName';

const mockAnnotations: any[] = [];

jest.mock('@playwright/test', () => ({
  test: {
    info: () => ({
      annotations: mockAnnotations,
    }),
  },
}));

describe('finish test reporting', () => {
  jest.spyOn(helpers, 'now').mockReturnValue(mockedDate);
  const testCase = {
    title: 'testTitle',
    id: 'testItemId',
    parent: {
      title: rootSuite,
      project: () => ({ name: rootSuite }),
      allTests: () => [
        {
          id: 'testItemId',
          title: 'testTitle',
          titlePath: () => ['', rootSuite, suiteName, 'testTitle'],
        },
      ],
      parent: {
        title: rootSuite,
        project: () => ({ name: rootSuite }),
        allTests: () => [
          {
            id: 'testItemId',
            title: 'testTitle',
            titlePath: () => ['', rootSuite, suiteName, 'testTitle'],
          },
        ],
      },
    },
    titlePath: () => [rootSuite, suiteName, 'testTitle'],
    annotations: [{ type: 'custom' }],
    _staticAnnotations: [{ type: 'custom' }],
  };
  let reporter: RPReporter;

  beforeEach(() => {
    reporter = new RPReporter(mockConfig);
    reporter.client = new RPClientMock(mockConfig);
    reporter.launchId = 'tempLaunchId';
    reporter.testItems = new Map([['testItemId', { id: 'tempTestItemId', name: 'testTitle' }]]);
    reporter.suites = new Map([
      [
        rootSuite,
        {
          id: 'rootsuiteId',
          name: rootSuite,
          testInvocationsLeft: 1,
          descendants: ['testItemId'],
        },
      ],
      [
        `${rootSuite}/${suiteName}`,
        {
          id: 'suiteId',
          name: suiteName,
          testInvocationsLeft: 1,
          descendants: ['testItemId'],
        },
      ],
    ]);

    // @ts-ignore
    reporter.addAttributes([{ key: 'key', value: 'value' }], testCase);
    // @ts-ignore
    reporter.setDescription('description', testCase);
  });

  test('client.finishTestItem should be called with test item id', async () => {
    const result = {
      status: 'passed',
    };
    const finishTestItemObj: FinishTestItemObjType = {
      endTime: mockedDate,
      status: result.status,
      attributes: [{ key: 'key', value: 'value' }],
      description: 'description',
    };

    // @ts-ignore
    await reporter.onTestEnd({ ...testCase, outcome: () => 'expected' }, result);

    expect(reporter.client.finishTestItem).toHaveBeenCalledTimes(3);
    expect(reporter.client.finishTestItem).toHaveBeenNthCalledWith(
      1,
      'tempTestItemId',
      finishTestItemObj,
    );
    expect(reporter.testItems.size).toBe(0);
  });

  test('client.finishTestItem should be called with skipped status (issue handling delegated to client)', async () => {
    const result = {
      status: 'skipped',
    };
    const finishTestItemObj: FinishTestItemObjType = {
      endTime: mockedDate,
      status: result.status,
      attributes: [{ key: 'key', value: 'value' }],
      description: 'description',
    };
    // @ts-ignore
    await reporter.onTestEnd({ ...testCase, outcome: () => 'skipped' }, result);

    expect(reporter.client.finishTestItem).toHaveBeenCalledTimes(3);
    expect(reporter.client.finishTestItem).toHaveBeenNthCalledWith(
      1,
      'tempTestItemId',
      finishTestItemObj,
    );
    expect(reporter.testItems.size).toBe(0);
  });

  test.each([
    ['skip', 'Cannot run suite.', '**Skip reason: Cannot run suite.**\ndescription'],
    ['fixme', 'Feature not implemented.', '**Skip reason: Feature not implemented.**\ndescription'],
  ])(
    'client.finishTestItem should be called with %s reason prepended to description',
    async (type, reason, expectedDescription) => {
      const testCaseWithAnnotation = {
        ...testCase,
        annotations: [{ type, description: reason }],
        outcome: () => 'skipped',
      };
      // @ts-ignore
      await reporter.onTestEnd(testCaseWithAnnotation, { status: 'skipped' });

      expect(reporter.client.finishTestItem).toHaveBeenNthCalledWith(1, 'tempTestItemId', {
        endTime: mockedDate,
        status: 'skipped',
        attributes: [{ key: 'key', value: 'value' }],
        description: expectedDescription,
      });
    },
  );

  test('client.finishTestItem should be called with skip reason as description when no existing description', async () => {
    reporter.testItems = new Map([['testItemId', { id: 'tempTestItemId', name: 'testTitle' }]]);
    const testCaseWithSkipAnnotation = {
      ...testCase,
      annotations: [{ type: 'skip', description: 'Cannot run suite.' }],
      outcome: () => 'skipped',
    };
    // @ts-ignore
    await reporter.onTestEnd(testCaseWithSkipAnnotation, { status: 'skipped' });

    expect(reporter.client.finishTestItem).toHaveBeenNthCalledWith(1, 'tempTestItemId', {
      endTime: mockedDate,
      status: 'skipped',
      description: '**Skip reason: Cannot run suite.**',
    });
  });

  test('client.finishTestItem should not be called in case of test item not found', async () => {
    const result = {
      status: 'passed',
    };
    reporter.testItems = new Map();
    // @ts-ignore
    await reporter.onTestEnd({ ...testCase, outcome: () => 'expected' }, result);

    expect(reporter.client.finishTestItem).toHaveBeenCalledTimes(0);
    expect(reporter.testItems.size).toBe(0);
  });

  test('client.finishTestItem should finish all unfinished steps and delete them from the this.nestedSteps', async () => {
    reporter.nestedSteps = new Map([[`${testCase.id}/testTitle`, { name: 'name', id: '1214r1' }]]);

    // @ts-ignore
    await reporter.onTestEnd({ ...testCase, outcome: () => 'expected' }, {});

    expect(reporter.nestedSteps.has(`${testCase.id}/testTitle`)).toBe(false);
  });
  test('client.finishTestItem should finish all unfinished steps and finish test steps with status INTERRUPTED if result.status === "timedOut"', async () => {
    const result = {
      status: 'timedOut',
    };

    reporter.nestedSteps = new Map([[`${testCase.id}/testTitle`, { name: 'name', id: '1214r1' }]]);

    // @ts-ignore
    await reporter.onTestEnd({ ...testCase, outcome: () => 'expected' }, result);

    const finishStepObject: FinishTestItemObjType = {
      endTime: mockedDate,
      status: STATUSES.INTERRUPTED,
    };

    expect(reporter.client.finishTestItem).toHaveBeenCalledWith('1214r1', finishStepObject);
  });
  test('client.finishTestItem should finish all unfinished steps and finish test steps with status FAILED if result.status === "failed"', async () => {
    const result = {
      status: 'failed',
    };

    reporter.nestedSteps = new Map([[`${testCase.id}/testTitle`, { name: 'name', id: '1214r1' }]]);

    // @ts-ignore
    await reporter.onTestEnd({ ...testCase, outcome: () => 'expected' }, result);

    const finishStepObject: FinishTestItemObjType = {
      endTime: mockedDate,
      status: STATUSES.FAILED,
    };

    expect(reporter.client.finishTestItem).toHaveBeenCalledWith('1214r1', finishStepObject);
  });

  describe('attachment handling', () => {
    let getAttachmentsSpy: jest.SpyInstance;

    beforeEach(() => {
      jest.clearAllMocks();
      // Reset reporter state
      reporter = new RPReporter(mockConfig);
      reporter.client = new RPClientMock(mockConfig);
      reporter.launchId = 'tempLaunchId';
      reporter.testItems = new Map([['testItemId', { id: 'tempTestItemId', name: 'testTitle' }]]);
      reporter.suites = new Map([
        [
          rootSuite,
          {
            id: 'rootsuiteId',
            name: rootSuite,
            testInvocationsLeft: 1,
            descendants: ['testItemId'],
          },
        ],
        [
          `${rootSuite}/${suiteName}`,
          {
            id: 'suiteId',
            name: suiteName,
            testInvocationsLeft: 1,
            descendants: ['testItemId'],
          },
        ],
      ]);
      // @ts-ignore
      reporter.addAttributes([{ key: 'key', value: 'value' }], testCase);
      // @ts-ignore
      reporter.setDescription('description', testCase);
    });

    afterEach(() => {
      if (getAttachmentsSpy) {
        getAttachmentsSpy.mockRestore();
      }
    });

    test('should process attachments and send logs for each attachment', async () => {
      const mockAttachments = [
        {
          name: 'screenshot.png',
          contentType: 'image/png',
          path: '/path/to/screenshot.png',
        },
        {
          name: 'video.webm',
          contentType: 'video/webm',
          path: '/path/to/video.webm',
        },
      ];

      const mockAttachmentFiles = [
        {
          name: 'testtitle_screenshot.png',
          type: 'image/png',
          content: Buffer.from('screenshot content'),
        },
        {
          name: 'testtitle_video.webm',
          type: 'video/webm',
          content: Buffer.from('video content'),
        },
      ];

      getAttachmentsSpy = jest
        .spyOn(utils, 'getAttachments')
        .mockResolvedValue(mockAttachmentFiles);
      const sendLogSpy = jest.spyOn(reporter, 'sendLog');

      const result = {
        status: 'passed',
        attachments: mockAttachments,
      };

      // @ts-ignore
      await reporter.onTestEnd({ ...testCase, outcome: () => 'expected' }, result);

      expect(utils.getAttachments).toHaveBeenCalledWith(
        mockAttachments,
        {
          uploadVideo: true,
          uploadTrace: true,
        },
        testCase.title,
      );

      expect(sendLogSpy).toHaveBeenCalledTimes(2);
      expect(sendLogSpy).toHaveBeenCalledWith('tempTestItemId', {
        message: 'Attachment testtitle_screenshot.png with type image/png',
        file: mockAttachmentFiles[0],
      });
      expect(sendLogSpy).toHaveBeenCalledWith('tempTestItemId', {
        message: 'Attachment testtitle_video.webm with type video/webm',
        file: mockAttachmentFiles[1],
      });
    });

    test('should filter out attachments already in stepAttachmentNames', async () => {
      const mockAttachments = [
        {
          name: 'screenshot.png',
          contentType: 'image/png',
          path: '/path/to/screenshot.png',
        },
        {
          name: 'video.webm',
          contentType: 'video/webm',
          path: '/path/to/video.webm',
        },
      ];

      const mockAttachmentFiles = [
        {
          name: 'testtitle_screenshot.png',
          type: 'image/png',
          content: Buffer.from('screenshot content'),
        },
        {
          name: 'testtitle_video.webm',
          type: 'video/webm',
          content: Buffer.from('video content'),
        },
      ];

      getAttachmentsSpy = jest
        .spyOn(utils, 'getAttachments')
        .mockResolvedValue(mockAttachmentFiles);
      const sendLogSpy = jest.spyOn(reporter, 'sendLog');

      reporter.stepAttachments.set(testCase.id, new Set(['testtitle_screenshot.png']));

      const result = {
        status: 'passed',
        attachments: mockAttachments,
      };

      // @ts-ignore
      await reporter.onTestEnd({ ...testCase, outcome: () => 'expected' }, result);

      expect(sendLogSpy).toHaveBeenCalledTimes(1);
      expect(sendLogSpy).toHaveBeenCalledWith('tempTestItemId', {
        message: 'Attachment testtitle_video.webm with type video/webm',
        file: mockAttachmentFiles[1],
      });
    });

    test('should handle empty stepAttachmentNames set', async () => {
      const mockAttachments = [
        {
          name: 'screenshot.png',
          contentType: 'image/png',
          path: '/path/to/screenshot.png',
        },
      ];

      const mockAttachmentFiles = [
        {
          name: 'testtitle_screenshot.png',
          type: 'image/png',
          content: Buffer.from('screenshot content'),
        },
      ];

      getAttachmentsSpy = jest
        .spyOn(utils, 'getAttachments')
        .mockResolvedValue(mockAttachmentFiles);
      const sendLogSpy = jest.spyOn(reporter, 'sendLog');

      const result = {
        status: 'passed',
        attachments: mockAttachments,
      };

      // @ts-ignore
      await reporter.onTestEnd({ ...testCase, outcome: () => 'expected' }, result);

      expect(sendLogSpy).toHaveBeenCalledTimes(1);
      expect(sendLogSpy).toHaveBeenCalledWith('tempTestItemId', {
        message: 'Attachment testtitle_screenshot.png with type image/png',
        file: mockAttachmentFiles[0],
      });
    });

    test('should respect uploadVideo config when processing attachments', async () => {
      const customConfig = {
        ...mockConfig,
        uploadVideo: false,
        uploadTrace: true,
      };

      const reporterWithConfig = new RPReporter(customConfig);
      reporterWithConfig.client = new RPClientMock(customConfig);
      reporterWithConfig.launchId = 'tempLaunchId';
      reporterWithConfig.testItems = new Map([
        ['testItemId', { id: 'tempTestItemId', name: 'testTitle' }],
      ]);
      reporterWithConfig.suites = new Map([
        [
          rootSuite,
          {
            id: 'rootsuiteId',
            name: rootSuite,
            testInvocationsLeft: 1,
            descendants: ['testItemId'],
          },
        ],
        [
          `${rootSuite}/${suiteName}`,
          {
            id: 'suiteId',
            name: suiteName,
            testInvocationsLeft: 1,
            descendants: ['testItemId'],
          },
        ],
      ]);

      const mockAttachments = [
        {
          name: 'screenshot.png',
          contentType: 'image/png',
          path: '/path/to/screenshot.png',
        },
      ];

      const mockAttachmentFiles = [
        {
          name: 'testtitle_screenshot.png',
          type: 'image/png',
          content: Buffer.from('screenshot content'),
        },
      ];

      getAttachmentsSpy = jest
        .spyOn(utils, 'getAttachments')
        .mockResolvedValue(mockAttachmentFiles);

      const result = {
        status: 'passed',
        attachments: mockAttachments,
      };

      // @ts-ignore
      await reporterWithConfig.onTestEnd({ ...testCase, outcome: () => 'expected' }, result);

      expect(utils.getAttachments).toHaveBeenCalledWith(
        mockAttachments,
        {
          uploadVideo: false,
          uploadTrace: true,
        },
        testCase.title,
      );
    });

    test('should not process attachments if result.attachments is empty', async () => {
      getAttachmentsSpy = jest.spyOn(utils, 'getAttachments');
      const sendLogSpy = jest.spyOn(reporter, 'sendLog');

      const result: any = {
        status: 'passed',
        attachments: [],
      };

      // @ts-ignore
      await reporter.onTestEnd({ ...testCase, outcome: () => 'expected' }, result);

      expect(getAttachmentsSpy).not.toHaveBeenCalled();
      expect(sendLogSpy).not.toHaveBeenCalled();
    });

    test('should not process attachments if result.attachments is undefined', async () => {
      getAttachmentsSpy = jest.spyOn(utils, 'getAttachments');
      const sendLogSpy = jest.spyOn(reporter, 'sendLog');

      const result = {
        status: 'passed',
      };

      // @ts-ignore
      await reporter.onTestEnd({ ...testCase, outcome: () => 'expected' }, result);

      expect(getAttachmentsSpy).not.toHaveBeenCalled();
      expect(sendLogSpy).not.toHaveBeenCalled();
    });
  });
});
