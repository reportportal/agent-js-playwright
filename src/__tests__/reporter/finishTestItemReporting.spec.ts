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

import { RPReporter } from '../../reporter';
import { mockConfig } from '../mocks/configMock';
import { RPClientMock } from '../mocks/RPClientMock';
import { FinishTestItemObjType } from '../../models';

const rootSuite = 'rootSuite';
const suiteName = 'suiteName';

describe('finish test reporting', () => {
  const testCase = {
    title: 'testTitle',
    parent: {
      title: rootSuite,
      project: () => ({ name: rootSuite }),
      allTests: () => [
        { title: 'testTitle', titlePath: () => ['', rootSuite, suiteName, 'testTitle'] },
      ],
      parent: {
        title: rootSuite,
        project: () => ({ name: rootSuite }),
        allTests: () => [
          { title: 'testTitle', titlePath: () => ['', rootSuite, suiteName, 'testTitle'] },
        ],
      },
    },
    titlePath: () => [rootSuite, suiteName, 'testTitle'],
  };
  let reporter: RPReporter;

  beforeEach(() => {
    reporter = new RPReporter(mockConfig);
    reporter.client = new RPClientMock(mockConfig);
    reporter.launchId = 'tempLaunchId';
    reporter.testItems = new Map([
      [`${rootSuite}/${suiteName}/testTitle`, { id: 'tempTestItemId', name: 'testTitle' }],
    ]);
    reporter.suites = new Map([
      [
        rootSuite,
        {
          id: 'rootsuiteId',
          name: rootSuite,
          testCount: 1,
          descendants: [`${rootSuite}/${suiteName}/testTitle`],
        },
      ],
      [
        `${rootSuite}/${suiteName}`,
        {
          id: 'suiteId',
          name: suiteName,
          testCount: 1,
          descendants: [`${rootSuite}/${suiteName}/testTitle`],
        },
      ],
    ]);

    // @ts-ignore
    reporter.addAttributes([{ key: 'key', value: 'value' }], testCase);
    // @ts-ignore
    reporter.setDescription('description', testCase);
  });

  test('client.finishTestItem should be called with test item id', async () => {
    reporter.config.skippedIssue = true;
    const result = {
      status: 'passed',
    };
    const finishTestItemObj: FinishTestItemObjType = {
      endTime: reporter.client.helpers.now(),
      status: result.status,
      attributes: [{ key: 'key', value: 'value' }],
      description: 'description',
    };

    // @ts-ignore
    await reporter.onTestEnd(testCase, result);

    expect(reporter.client.finishTestItem).toHaveBeenCalledTimes(3);
    expect(reporter.client.finishTestItem).toHaveBeenNthCalledWith(
      1,
      'tempTestItemId',
      finishTestItemObj,
    );
    expect(reporter.testItems.size).toBe(0);
  });

  test('client.finishTestItem should be called with issueType NOT_ISSUE', async () => {
    reporter.config.skippedIssue = false;
    const result = {
      status: 'skipped',
    };
    const finishTestItemObj: FinishTestItemObjType = {
      endTime: reporter.client.helpers.now(),
      status: result.status,
      attributes: [{ key: 'key', value: 'value' }],
      description: 'description',
      issue: { issueType: 'NOT_ISSUE' },
    };
    // @ts-ignore
    await reporter.onTestEnd(testCase, result);

    expect(reporter.client.finishTestItem).toHaveBeenCalledTimes(3);
    expect(reporter.client.finishTestItem).toHaveBeenNthCalledWith(
      1,
      'tempTestItemId',
      finishTestItemObj,
    );
    expect(reporter.testItems.size).toBe(0);
  });
});
