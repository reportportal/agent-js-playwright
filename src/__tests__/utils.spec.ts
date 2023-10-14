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
  getSystemAttributes,
  promiseErrorHandler,
  sendEventToReporter,
  isFalse,
  getAttachments,
  isErrorLog,
  calculateRpStatus,
  getAdditionalInfo,
} from '../utils';
import fs from 'fs';
import path from 'path';
import {
  STATUSES,
  TestOutcome,
  BASIC_ATTACHMENT_CONTENT_TYPES,
  BASIC_ATTACHMENT_NAMES,
  RPTestInfo,
} from '../constants';
import { TestCase } from '@playwright/test/reporter';
import { TestAdditionalInfo } from '../models/reporting';

describe('testing utils', () => {
  test('isFalse', () => {
    expect(isFalse(false)).toBe(true);
    expect(isFalse('false')).toBe(true);
    expect(isFalse(undefined)).toBe(false);
    expect(isFalse(null)).toBe(false);
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

  describe('getSystemAttributes', () => {
    const expectedRes = [
      {
        key: 'agent',
        value: `${pjsonName}|${pjsonVersion}`,
        system: true,
      },
    ];
    test('should return the list of system attributes', () => {
      const systemAttributes = getSystemAttributes();

      expect(systemAttributes).toEqual(expectedRes);
    });

    test('should return expected list of system attributes in case skippedIssue=false', () => {
      const systemAttributes = getSystemAttributes(false);
      const skippedIssueAttribute = {
        key: 'skippedIssue',
        value: 'false',
        system: true,
      };

      expect(systemAttributes).toEqual([...expectedRes, skippedIssueAttribute]);
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
      const codeRef = getCodeRef(mockedTest, undefined);

      expect(codeRef).toBe('');
    });
  });
  describe('sendEventToReporter', () => {
    test('func must send event to reporter', () => {
      const type = 'ADD_ATTRIBUTES';
      const data = [
        {
          key: 'key',
          value: 'value',
        },
      ];
      const spyProcess = jest.spyOn(process.stdout, 'write');
      sendEventToReporter(type, data);
      expect(spyProcess).toHaveBeenCalledWith(JSON.stringify({ type, data }));
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

      jest.spyOn(fs, 'existsSync').mockImplementationOnce((): boolean => true);

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

  describe('getAdditionalInfo', () => {
    test('Should collect only allowed fields', () => {
      const testCase = {
        results: [
          {
            attachments: [
              {
                name: RPTestInfo.attributes,
                contentType: 'application/json',
                body: Buffer.from(
                  JSON.stringify([
                    { key: 'key1', value: 'value1', system: true },
                    { key: 'key2', value: 'value2', system: true },
                  ]),
                ),
              },
              {
                name: RPTestInfo.description,
                contentType: 'plain/text',
                body: Buffer.from('Description'),
              },
              {
                name: RPTestInfo.status,
                contentType: 'plain/text',
                body: Buffer.from('skipped'),
              },
              {
                name: RPTestInfo.status,
                contentType: 'plain/text',
                body: Buffer.from('failed'),
              },
              {
                name: RPTestInfo.testCaseId,
                contentType: 'plain/text',
                body: Buffer.from('testCaseId'),
              },
              {
                name: 'notAllowedField',
                contentType: 'plain/text',
                body: Buffer.from('notAllowedValue'),
              },
            ],
          },
        ],
      };

      const expectedResult: TestAdditionalInfo = {
        attributes: [
          { key: 'key1', value: 'value1', system: true },
          { key: 'key2', value: 'value2', system: true },
        ],
        description: 'Description',
        status: 'failed',
        testCaseId: 'testCaseId',
      };

      const additionalInfo = getAdditionalInfo(testCase as TestCase);

      expect(additionalInfo).toEqual(expectedResult);
    });

    test('Should recover from error in case if JSON is not valid', () => {
      const testCase = {
        results: [
          {
            attachments: [
              {
                name: RPTestInfo.attributes,
                contentType: 'application/json',
                body: Buffer.from(
                  `{ key: 'key1', value: 'value1', system: true },
                  { key: 'key2', value: 'value2', system: true }`,
                ),
              },
              {
                name: RPTestInfo.description,
                contentType: 'plain/text',
                body: Buffer.from('Description'),
              },
              {
                name: RPTestInfo.status,
                contentType: 'plain/text',
                body: Buffer.from('skipped'),
              },
            ],
          },
        ],
      };

      const expectedResult: TestAdditionalInfo = {
        attributes: [],
        description: 'Description',
        status: 'skipped',
        testCaseId: '',
      };

      const error = new Error('Unexpected token k in JSON at position 2');

      console.error = jest.fn();

      const additionalInfo = getAdditionalInfo(testCase as TestCase);

      expect(console.error).toBeCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith(error.message);
      expect(additionalInfo).toEqual(expectedResult);
    });
  });
});
