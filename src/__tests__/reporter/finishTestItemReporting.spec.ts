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

// @ts-ignore
import { EVENTS } from '@reportportal/client-javascript/lib/constants/events';
import { RPReporter } from '../../reporter';
import { mockConfig } from '../mocks/configMock';
import { RPClientMock } from '../mocks/RPClientMock';
import { FinishTestItemObjType } from '../../models';
import { STATUSES } from '../../constants';
import clientHelpers from '@reportportal/client-javascript/lib/helpers';

const rootSuite = 'rootSuite';
const suiteName = 'suiteName';

describe('finish test reporting', () => {
  const testCase = {
    title: 'testTitle',
    id: 'testItemId',
    //@ts-ignore
    results: [{ attachments: [] }],
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
          testCount: 1,
          descendants: ['testItemId'],
        },
      ],
      [
        `${rootSuite}/${suiteName}`,
        {
          id: 'suiteId',
          name: suiteName,
          testCount: 1,
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
    reporter.config.skippedIssue = true;
    const result = {
      status: 'passed',
    };
    const finishTestItemObj: FinishTestItemObjType = {
      endTime: clientHelpers.now(),
      status: result.status,
      attributes: [{ key: 'key', value: 'value' }],
      description: 'description',
    };

    await reporter.onTestEnd(
      {
        ...testCase,
        outcome: () => 'expected',
        results: [
          // @ts-ignore
          {
            attachments: [
              {
                name: EVENTS.ADD_ATTRIBUTES,
                body: Buffer.from(JSON.stringify([{ key: 'key', value: 'value' }])),
                contentType: 'application/json',
              },
              {
                name: EVENTS.SET_DESCRIPTION,
                body: Buffer.from('description'),
                contentType: 'text/plain',
              },
            ],
          },
        ],
      },
      result,
    );

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
      endTime: clientHelpers.now(),
      status: result.status,
      attributes: [{ key: 'key', value: 'value' }],
      description: 'description',
      issue: { issueType: 'NOT_ISSUE' },
    };
    // @ts-ignore
    await reporter.onTestEnd(
      {
        ...testCase,
        outcome: () => 'skipped',
        results: [
          // @ts-ignore
          {
            attachments: [
              {
                name: EVENTS.ADD_ATTRIBUTES,
                body: Buffer.from(JSON.stringify([{ key: 'key', value: 'value' }])),
                contentType: 'application/json',
              },
              {
                name: EVENTS.SET_DESCRIPTION,
                body: Buffer.from('description'),
                contentType: 'text/plain',
              },
            ],
          },
        ],
      },
      result,
    );

    expect(reporter.client.finishTestItem).toHaveBeenCalledTimes(3);
    expect(reporter.client.finishTestItem).toHaveBeenNthCalledWith(
      1,
      'tempTestItemId',
      finishTestItemObj,
    );
    expect(reporter.testItems.size).toBe(0);
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
      endTime: clientHelpers.now(),
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
      endTime: clientHelpers.now(),
      status: STATUSES.FAILED,
    };

    expect(reporter.client.finishTestItem).toHaveBeenCalledWith('1214r1', finishStepObject);
  });

  test('client.finishTestItem should call reporter.client.finishTestItem with correct values', async () => {
    const result = { status: 'passed' };

    await reporter.onTestEnd(
      {
        ...testCase,
        outcome: () => 'expected',
        results: [
          // @ts-ignore
          {
            attachments: [
              {
                name: EVENTS.ADD_ATTRIBUTES,
                contentType: 'application/json',
                body: Buffer.from(
                  JSON.stringify([
                    { key: 'key1', value: 'value1', system: false },
                    { key: 'key2', value: 'value2', system: false },
                  ]),
                ),
              },
              {
                name: EVENTS.SET_DESCRIPTION,
                contentType: 'plain/text',
                body: Buffer.from('Description'),
              },
              {
                name: EVENTS.SET_STATUS,
                contentType: 'plain/text',
                body: Buffer.from('skipped'),
              },
              {
                name: EVENTS.SET_STATUS,
                contentType: 'plain/text',
                body: Buffer.from('interrupted'),
              },
              {
                name: EVENTS.SET_TEST_CASE_ID,
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
      },
      result,
    );

    const finishStepObject: FinishTestItemObjType = {
      endTime: clientHelpers.now(),
      status: STATUSES.INTERRUPTED,
      attributes: [{ key: 'key', value: 'value' }],
      description: 'description',
      testCaseId: 'testCaseId',
    };

    expect(reporter.client.finishTestItem).toHaveBeenNthCalledWith(
      1,
      'tempTestItemId',
      finishStepObject,
    );
  });
});
