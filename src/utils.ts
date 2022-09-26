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

import { TestCase, TestStatus } from '@playwright/test/reporter';
import fs from 'fs';
import path from 'path';
// @ts-ignore
import { name as pjsonName, version as pjsonVersion } from '../package.json';
import { Attribute } from './models';
import { Attachment } from './models/reporting';
import { STATUSES } from './constants';

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

export const getSystemAttributes = (skippedIssue = true): Array<Attribute> => {
  const systemAttributes = [
    {
      key: 'agent',
      value: `${pjsonName}|${pjsonVersion}`,
      system: true,
    },
  ];

  if (isFalse(skippedIssue)) {
    const skippedIssueAttribute = {
      key: 'skippedIssue',
      value: 'false',
      system: true,
    };
    systemAttributes.push(skippedIssueAttribute);
  }

  return systemAttributes;
};

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
  process.stdout.write(JSON.stringify({ type, data, suite }));
};

type attachments = { name: string; path?: string; body?: Buffer; contentType: string }[];

export const getAttachments = async (attachments: attachments): Promise<Attachment[]> => {
  const readFilePromises = attachments
    .filter((attachment) => attachment.body || attachment.path)
    .map(async ({ name, path: attachmentPath, contentType, body }) => {
      let fileContent;
      if (body) {
        fileContent = body;
      } else {
        if (!fs.existsSync(attachmentPath)) {
          return;
        }
        fileContent = await fsPromises.readFile(attachmentPath);
      }

      return {
        name,
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
export const convertToRpStatus = (status: TestStatus): STATUSES => {
  const isRpStatus = Object.values(STATUSES).includes(<STATUSES>status);

  if (isRpStatus) {
    return <STATUSES>status;
  }
  return STATUSES.FAILED;
};
