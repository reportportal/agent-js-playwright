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

// @ts-ignore
import { name as pjsonName, version as pjsonVersion } from '../../package.json';
import {
  getAgentInfo,
  getCodeRef,
  promiseErrorHandler,
  sendEventToReporter,
  isFalse,
  getAttachments,
  isErrorLog,
  fileExists,
  calculateRpStatus,
  getSkipReason,
} from '../utils';
import fs from 'fs';
import path from 'path';
import {
  STATUSES,
  TestOutcome,
  BASIC_ATTACHMENT_CONTENT_TYPES,
  BASIC_ATTACHMENT_NAMES,
} from '../constants';

const mockAnnotations: any[] = [];

jest.mock('@playwright/test', () => ({
  test: {
    info: () => ({
      annotations: mockAnnotations,
    }),
  },
}));

describe('testing utils', () => {
  test('isFalse', () => {
    expect(isFalse(false)).toBe(true);
    expect(isFalse('false')).toBe(true);
    expect(isFalse(undefined)).toBe(false);
    expect(isFalse(null as any)).toBe(false);
  });

  describe('isErrorLog', () => {
    test('isErrorLog with letters in different cases should return true', () => {
      const message = 'Some TEXT with ErRoR';
      expect(isErrorLog(message)).toBe(true);
    });
    test('isErrorLog without "error" word should return false', () => {
      const messageWithoutError = 'Some text';
      expect(isErrorLog(messageWithoutError)).toBe(false);
    });
  });

  describe('fileExists', () => {
    test('should return true', async () => {
      jest.spyOn(fs.promises, 'stat').mockImplementationOnce(() => Promise.resolve({} as fs.Stats));

      const existingFilePath = 'existing-file-path';
      const isFileExist = await fileExists(existingFilePath);

      expect(isFileExist).toBe(true);
    });
    test('should return false', async () => {
      const notExistingFilePath = 'not-existing-file-path';
      const isFileExist = await fileExists(notExistingFilePath);

      expect(isFileExist).toBe(false);
    });
  });

  describe('promiseErrorHandler', () => {
    let spyConsoleError: jest.SpyInstance;
    beforeEach(() => {
      spyConsoleError = jest.spyOn(console, 'error');
    });
    afterEach(() => {
      jest.clearAllMocks();
    });

    test('should log error with empty message as it is not provided in case of promise rejected', async () => {
      const promiseWithError = Promise.reject('error message');
      await promiseErrorHandler(promiseWithError);

      expect(spyConsoleError).toBeCalledTimes(1);
      expect(spyConsoleError).toBeCalledWith('', 'error message');
    });

    test('should log error with provided message in case of promise rejected', async () => {
      const promiseWithError = Promise.reject('error message');
      await promiseErrorHandler(promiseWithError, 'Failed to finish suite');

      expect(spyConsoleError).toBeCalledTimes(1);
      expect(spyConsoleError).toBeCalledWith('Failed to finish suite', 'error message');
    });

    test('should not log anything in case of promise resolved', async () => {
      const promise = Promise.resolve();
      await promiseErrorHandler(promise, 'Failed to finish suite');

      expect(spyConsoleError).toBeCalledTimes(0);
    });
  });

  describe('getAgentInfo', () => {
    test('should return the name and version of application from package.json file', () => {
      const agentInfo = getAgentInfo();

      expect(agentInfo.name).toBe(pjsonName);
      expect(agentInfo.version).toBe(pjsonVersion);
    });
  });

  describe('getCodeRef', () => {
    const projectName = 'Google Chrome tests';
    const mockedTest = {
      location: {
        file: `C:${path.sep}testProject${path.sep}tests${path.sep}example.js`,
        line: 5,
        column: 3,
      },
      titlePath: () => [
        '',
        projectName,
        'tests/example.js',
        'rootDescribe',
        'parentDescribe',
        'testTitle',
      ],
    };

    test('should return correct code reference for test title (all titles before, including provided) and omit empty paths', () => {
      const expectedCodeRef =
        'Google Chrome tests/tests/example.js/rootDescribe/parentDescribe/testTitle';
      const codeRef = getCodeRef(mockedTest, 'testTitle');

      expect(codeRef).toBe(expectedCodeRef);
    });

    test('should return correct code reference for test title (all titles before, including provided) and omit empty paths', () => {
      const expectedCodeRef = 'Google Chrome tests/tests/example.js/rootDescribe';
      const codeRef = getCodeRef(mockedTest, 'rootDescribe');

      expect(codeRef).toBe(expectedCodeRef);
    });

    test('should return correct code reference for test title and omit pathToExclude if provided', () => {
      const expectedCodeRef = 'tests/example.js/rootDescribe';
      const codeRef = getCodeRef(mockedTest, 'rootDescribe', projectName);

      expect(codeRef).toBe(expectedCodeRef);
    });

    test('should return an empty string if test title is empty', () => {
      const codeRef = getCodeRef(mockedTest, '');

      expect(codeRef).toBe('');
    });
  });
  describe('sendEventToReporter', () => {
    beforeEach(() => {
      mockAnnotations.length = 0;
    });

    test('should send event to annotations when no suite is given', () => {
      const type = 'ADD_ATTRIBUTES';
      const data = [{ key: 'key', value: 'value' }];

      sendEventToReporter(type, data);

      expect(mockAnnotations).toEqual([
        {
          type,
          description: JSON.stringify(data),
        },
      ]);
    });

    test('should write event to stdout when suite is given', () => {
      const type = 'ADD_ATTRIBUTES';
      const data = [{ key: 'key', value: 'value' }];
      const suite = 'someSuite';

      // Mock process.stdout.write
      const mockWrite = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);

      sendEventToReporter(type, data, suite);

      expect(mockWrite).toHaveBeenCalledWith(JSON.stringify({ type, data, suite }));

      mockWrite.mockRestore();
    });
  });

  describe('getAttachments', () => {
    test('should return correct attachment list with presented body', async () => {
      const fileData = Buffer.from([1, 2, 3, 4, 5, 6, 7]);
      const attachments = [
        {
          name: 'filename',
          contentType: 'image/png',
          body: fileData,
        },
      ];

      const expectedAttachments = [
        {
          name: 'filename',
          type: 'image/png',
          content: fileData,
        },
      ];

      const attachmentResult = await getAttachments(attachments);

      expect(attachmentResult).toEqual(expectedAttachments);
    });

    test('should return an empty attachment list in case of no body and no path provided', async () => {
      const attachments = [
        {
          name: 'filename',
          contentType: 'image/png',
        },
      ];

      const attachmentResult = await getAttachments(attachments);

      expect(attachmentResult).toEqual([]);
    });

    test("should return an empty attachment list in case of no body, path provided, but file doesn't exists", async () => {
      jest.spyOn(fs, 'existsSync').mockImplementationOnce((): boolean => false);

      const attachments = [
        {
          name: 'filename',
          contentType: 'image/png',
          path: 'path/to/attachment',
        },
      ];

      const attachmentResult = await getAttachments(attachments);

      expect(attachmentResult).toEqual([]);
    });

    test('should return correct attachment list with presented path and body', async () => {
      const file1Data = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]);
      const file2Data = Buffer.from([1, 2, 3, 4, 5, 6, 7]);

      jest.spyOn(fs.promises, 'stat').mockImplementationOnce(() => Promise.resolve({} as fs.Stats));

      jest.spyOn(fs.promises, 'readFile').mockImplementationOnce(async () => file1Data);

      const attachments = [
        {
          name: 'filename1',
          contentType: 'image/png',
          path: 'path/to/attachment',
        },
        {
          name: 'filename2',
          contentType: 'image/png',
          body: file2Data,
        },
        {
          name: 'filename3',
          contentType: 'image/png',
        },
      ];

      const expectedAttachments = [
        {
          name: 'filename1',
          type: 'image/png',
          content: file1Data,
        },
        {
          name: 'filename2',
          type: 'image/png',
          content: file2Data,
        },
      ];

      const attachmentResult = await getAttachments(attachments);

      expect(attachmentResult).toEqual(expectedAttachments);
    });

    test('should return only attachments that have been read without errors', async () => {
      const file2Data = Buffer.from([1, 2, 3, 4, 5, 6, 7]);

      jest.spyOn(fs, 'existsSync').mockImplementationOnce((): boolean => true);

      jest.spyOn(fs.promises, 'readFile').mockImplementationOnce(async () => {
        throw new Error('Read file error');
      });

      const attachments = [
        {
          name: 'filename1',
          contentType: 'image/png',
          path: 'path/to/attachment',
        },
        {
          name: 'filename2',
          contentType: 'image/png',
          body: file2Data,
        },
        {
          name: 'filename3',
          contentType: 'image/png',
        },
      ];

      const expectedAttachments = [
        {
          name: 'filename2',
          type: 'image/png',
          content: file2Data,
        },
      ];

      const attachmentResult = await getAttachments(attachments);

      expect(attachmentResult).toEqual(expectedAttachments);
    });

    test('should log error to console when reading file fails', async () => {
      const readError = new Error('Read file error');
      const spyConsoleError = jest.spyOn(console, 'error').mockImplementation();

      jest.spyOn(fs.promises, 'stat').mockImplementationOnce(() => Promise.resolve({} as fs.Stats));
      jest.spyOn(fs.promises, 'readFile').mockImplementationOnce(async () => {
        throw readError;
      });

      const attachments = [
        {
          name: 'filename1',
          contentType: 'image/png',
          path: 'path/to/attachment',
        },
      ];

      const attachmentResult = await getAttachments(attachments);

      expect(spyConsoleError).toHaveBeenCalledWith(readError);
      expect(attachmentResult).toEqual([]);

      spyConsoleError.mockRestore();
    });

    describe('with attachments options', () => {
      test('should return empty attachment list without trace in case of uploadTrace option is false', async () => {
        const attachments = [
          {
            name: BASIC_ATTACHMENT_NAMES.TRACE,
            contentType: BASIC_ATTACHMENT_CONTENT_TYPES.TRACE,
            path: 'path/to/trace-attachment',
          },
        ];

        const attachmentResult = await getAttachments(attachments, { uploadTrace: false });

        expect(attachmentResult).toEqual([]);
      });

      test('should return empty attachment list without video in case of uploadVideo option is false', async () => {
        const attachments = [
          {
            name: BASIC_ATTACHMENT_NAMES.VIDEO,
            contentType: BASIC_ATTACHMENT_CONTENT_TYPES.VIDEO,
            path: 'path/to/trace-attachment',
          },
        ];

        const attachmentResult = await getAttachments(attachments, { uploadVideo: false });

        expect(attachmentResult).toEqual([]);
      });

      test('should return correct attachment list with video and trace as uploadVideo and uploadTrace options are true by default', async () => {
        const fileData = Buffer.from([1, 2, 3, 4, 5, 6, 7]);

        const attachments = [
          {
            name: BASIC_ATTACHMENT_NAMES.TRACE,
            contentType: BASIC_ATTACHMENT_CONTENT_TYPES.TRACE,
            body: fileData,
          },
          {
            name: BASIC_ATTACHMENT_NAMES.VIDEO,
            contentType: BASIC_ATTACHMENT_CONTENT_TYPES.VIDEO,
            body: fileData,
          },
        ];

        const expectedAttachments = [
          {
            name: BASIC_ATTACHMENT_NAMES.TRACE,
            type: BASIC_ATTACHMENT_CONTENT_TYPES.TRACE,
            content: fileData,
          },
          {
            name: BASIC_ATTACHMENT_NAMES.VIDEO,
            type: BASIC_ATTACHMENT_CONTENT_TYPES.VIDEO,
            content: fileData,
          },
        ];

        const attachmentResult = await getAttachments(attachments);

        expect(attachmentResult).toEqual(expectedAttachments);
      });
    });
  });
  describe('calculateRpStatus', () => {
    test('calculateRpStatus should return STATUSES.FAILED in case of unknown outcome', () => {
      const status = calculateRpStatus(<TestOutcome>'foo', 'interrupted', []);
      expect(status).toBe(STATUSES.FAILED);
    });
    test('calculateRpStatus should return STATUSES.PASSED in case of "expected" outcome', () => {
      const status = calculateRpStatus('expected', 'failed', []);
      expect(status).toBe(STATUSES.PASSED);
    });
    test('calculateRpStatus should return STATUSES.PASSED in case of "flaky" outcome', () => {
      const status = calculateRpStatus('flaky', 'failed', []);
      expect(status).toBe(STATUSES.PASSED);
    });
    test('calculateRpStatus should return STATUSES.SKIPPED in case of "skipped" outcome and "skipped" status', () => {
      const status = calculateRpStatus('skipped', 'failed', []);
      expect(status).toBe(STATUSES.SKIPPED);
    });
    test('calculateRpStatus should return STATUSES.INTERRUPTED in case of "skipped" outcome and "interrupted" status', () => {
      const status = calculateRpStatus('skipped', 'interrupted', []);
      expect(status).toBe(STATUSES.INTERRUPTED);
    });
    test('calculateRpStatus should return STATUSES.FAILED in case of "unexpected" outcome and no "fail" annotations', () => {
      const status = calculateRpStatus('unexpected', 'failed', []);
      expect(status).toBe(STATUSES.FAILED);
    });
    test('calculateRpStatus should return STATUSES.FAILED in case of "unexpected" outcome, "fail" annotation and "passed" status', () => {
      const status = calculateRpStatus('unexpected', 'passed', [{ type: 'fail' }]);
      expect(status).toBe(STATUSES.FAILED);
    });
    test('calculateRpStatus should return STATUSES.PASSED in case of "unexpected" outcome, "fail" annotation and "failed" status', () => {
      const status = calculateRpStatus('unexpected', 'failed', [{ type: 'fail' }]);
      expect(status).toBe(STATUSES.PASSED);
    });
  });

  describe('getSkipReason', () => {
    test.each([
      [[{ type: 'skip', description: 'Cannot run suite.' }], 'Cannot run suite.'],
      [[{ type: 'fixme', description: 'Feature not implemented.' }], 'Feature not implemented.'],
      [
        [
          { type: 'skip', description: 'First reason' },
          { type: 'skip', description: 'Second reason' },
        ],
        'First reason',
      ],
      [
        [
          { type: 'skip', description: 'Skip reason' },
          { type: 'fixme', description: 'Fixme reason' },
        ],
        'Skip reason',
      ],
    ])('should return skip reason for %j', (annotations, expected) => {
      expect(getSkipReason(annotations)).toBe(expected);
    });

    test.each([
      { annotations: [{ type: 'skip' }], name: 'skip annotation without description' },
      {
        annotations: [{ type: 'custom', description: 'Some description' }],
        name: 'non-skip annotation',
      },
      { annotations: [], name: 'empty annotations array' },
    ])('should return undefined for $name', ({ annotations }) => {
      expect(getSkipReason(annotations)).toBeUndefined();
    });
  });
});
