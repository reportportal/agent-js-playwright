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

import { TestCase } from '@playwright/test/reporter';
// @ts-ignore
import { name as pjsonName, version as pjsonVersion } from '../package.json';
import { Attribute } from './models';
import path from 'path';
import { TEST_ITEM_TYPES } from './constants';

export const promiseErrorHandler = (promise: Promise<any>, message = '') =>
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

  if (skippedIssue === false) {
    const skippedIssueAttribute = {
      key: 'skippedIssue',
      value: 'false',
      system: true,
    };
    systemAttributes.push(skippedIssueAttribute);
  }

  return systemAttributes;
};

type testItemPick = Pick<TestCase, 'location' | 'titlePath'>;

export const getCodeRef = (
  testItem: testItemPick,
  itemType: TEST_ITEM_TYPES,
  sliceIndex = 0,
): string => {
  const testFileDir = path
    .parse(path.normalize(path.relative(process.cwd(), testItem.location.file)))
    .dir.replace(new RegExp('\\'.concat(path.sep), 'g'), '/');
  const filteredTitlesPath = testItem.titlePath().filter((itemPath) => itemPath !== '');

  switch (itemType) {
    case TEST_ITEM_TYPES.TEST: {
      const testHierarchicalPath = filteredTitlesPath.slice(0, -1 - sliceIndex).join('/');
      return `${testFileDir}/${testHierarchicalPath}`;
    }
    case TEST_ITEM_TYPES.SUITE: {
      const testHierarchicalPath = filteredTitlesPath.slice(0, 1).join('/');
      return `${testFileDir}/${testHierarchicalPath}`;
    }
    default: {
      const testHierarchicalPath = filteredTitlesPath.join('/');
      return `${testFileDir}/${testHierarchicalPath}`;
    }
  }
};

export const sendEventToReporter = (type: string, data: any, suite?: string): void => {
  process.stdout.write(JSON.stringify({ type, data, suite }));
};
