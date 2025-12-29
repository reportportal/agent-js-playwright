/*
 *  Copyright 2022 EPAM Systems
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

import { TestCase, TestStatus, TestResult } from '@playwright/test/reporter';
import fs from 'fs';
import path from 'path';
// @ts-ignore
import { name as pjsonName, version as pjsonVersion } from '../package.json';
import { Attribute, Attachment, AttachmentsConfig } from './models';
import {
  STATUSES,
  TestAnnotation,
  TestOutcome,
  BASIC_ATTACHMENT_NAMES,
  BASIC_ATTACHMENT_CONTENT_TYPES,
  TEST_ANNOTATION_TYPES,
  TEST_OUTCOME_TYPES,
} from './constants';
import { test } from '@playwright/test';
import { RPReporter } from './reporter';

const fsPromises = fs.promises;

export const isFalse = (value: string | boolean | undefined): boolean =>
  [false, 'false'].includes(value);

export const promiseErrorHandler = (promise: Promise<void>, message = ''): Promise<void> =>
  promise.catch((err) => {
    console.error(message, err);
  });

export const getAgentInfo = (): { version: string; name: string } => ({
  version: pjsonVersion,
  name: pjsonName,
});

export const getSystemAttribute = (): Attribute => ({
  key: 'agent',
  value: `${getAgentInfo().name}|${getAgentInfo().version}`,
  system: true,
});

type testItemPick = Pick<TestCase, 'titlePath'>;

export const getCodeRef = (
  testItem: testItemPick,
  itemTitle: string,
  pathToExclude?: string,
): string => {
  if (!itemTitle) {
    return '';
  }
  const filteredTitlesPath = testItem
    .titlePath()
    .filter((itemPath) => itemPath !== '' && itemPath !== pathToExclude);
  const itemIndex = filteredTitlesPath.indexOf(itemTitle);

  return filteredTitlesPath
    .slice(0, itemIndex + 1)
    .join('/')
    .replace(new RegExp('\\'.concat(path.sep), 'g'), '/');
};

export const sendEventToReporter = (type: string, data: any, suite?: string): void => {
  const annotation = {
    type: type,
    description: JSON.stringify(data),
  };
  if (suite) {
    process.stdout.write(JSON.stringify({ type, data, suite }));
  } else {
    test.info().annotations.push(annotation);
  }
};

export const fileExists = async (filePath: string) => {
  try {
    await fsPromises.stat(filePath);
    return true;
  } catch (error) {
    // ENOENT code - File does not exist
    if (error.code === 'ENOENT') {
      return false;
    } else {
      throw error;
    }
  }
};

export const getAttachments = async (
  attachments: TestResult['attachments'],
  { uploadTrace, uploadVideo }: AttachmentsConfig = { uploadTrace: true, uploadVideo: true },
  testTitle?: string,
): Promise<Attachment[]> => {
  const isTraceNotAllowed = isFalse(uploadTrace);
  const isVideoNotAllowed = isFalse(uploadVideo);

  const readFilePromises = attachments
    .filter(({ name, path: attachmentPath, contentType, body }) => {
      const isValidAttachment = body || attachmentPath;

      const ignoreAsTrace =
        isTraceNotAllowed &&
        name === BASIC_ATTACHMENT_NAMES.TRACE &&
        contentType === BASIC_ATTACHMENT_CONTENT_TYPES.TRACE;

      const ignoreAsVideo =
        isVideoNotAllowed &&
        name === BASIC_ATTACHMENT_NAMES.VIDEO &&
        contentType === BASIC_ATTACHMENT_CONTENT_TYPES.VIDEO;

      return isValidAttachment && !ignoreAsTrace && !ignoreAsVideo;
    })
    .map(async ({ name, path: attachmentPath, contentType, body }) => {
      let fileContent;

      try {
        if (body) {
          fileContent = body;
        } else {
          const isFileExist = await fileExists(attachmentPath);
          if (!isFileExist) {
            return;
          }
          fileContent = await fsPromises.readFile(attachmentPath);
        }
      } catch (e) {
        console.error(e);
        return;
      }
      const attachmentName = testTitle
        ? testTitle
            .toLowerCase()
            .replace(/[^a-z0-9 _-]/g, '')
            .replace(/\s+/g, '-')
            .concat('_', name)
        : name;

      return {
        name: attachmentName,
        type: contentType,
        content: fileContent,
      };
    });

  return (await Promise.all(readFilePromises)).filter(Boolean);
};

export const isErrorLog = (message: string): boolean => {
  return message.toLowerCase().includes('error');
};

// https://playwright.dev/docs/api/class-testresult#test-result-status
export const calculateRpStatus = (
  outcome: TestOutcome,
  status: TestStatus,
  annotations: TestAnnotation[],
): STATUSES => {
  let calculatedStatus = STATUSES.FAILED;

  switch (outcome) {
    case TEST_OUTCOME_TYPES.EXPECTED:
      calculatedStatus = STATUSES.PASSED;
      break;
    case TEST_OUTCOME_TYPES.FLAKY:
      calculatedStatus = STATUSES.PASSED;
      break;
    case TEST_OUTCOME_TYPES.UNEXPECTED:
      if (annotations.some((annotation) => annotation.type === TEST_ANNOTATION_TYPES.FAIL)) {
        calculatedStatus = status === STATUSES.PASSED ? STATUSES.FAILED : STATUSES.PASSED;
      }
      break;
    case TEST_OUTCOME_TYPES.SKIPPED:
      calculatedStatus = status === STATUSES.INTERRUPTED ? STATUSES.INTERRUPTED : STATUSES.SKIPPED;
      break;
    default:
      break;
  }

  return calculatedStatus;
};

export const safeParse = (input: unknown) => {
  if (typeof input !== 'string') {
    return input;
  }

  try {
    const parsed = JSON.parse(input);
    return parsed;
  } catch {
    return input;
  }
};
