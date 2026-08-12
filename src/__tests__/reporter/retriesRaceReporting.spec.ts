/*
 *  Copyright 2026 EPAM Systems
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
import * as utils from '../../utils';
import { Attachment } from '../../models';

const suiteName = 'suiteName';
const testId = 'testItemId';

const createDeferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

const buildTestCase = () => ({
  title: 'testTitle',
  id: testId,
  parent: {
    title: suiteName,
    location: 'tests/example.js',
    project: () => ({ name: '' }),
    allTests: () => [{ id: testId }],
  },
  titlePath: () => [suiteName, 'testTitle'],
  annotations: [] as { type: string; description?: string }[],
  outcome: () => 'flaky',
  retries: 1,
  results: [{}, {}],
});

describe('retries race: failing attempt with attachments must not orphan the retry item (#212)', () => {
  jest.spyOn(helpers, 'now').mockReturnValue(mockedDate);

  let reporter: RPReporter;

  beforeEach(() => {
    jest.clearAllMocks();
    reporter = new RPReporter(mockConfig);
    reporter.client = new RPClientMock(mockConfig) as unknown as typeof reporter.client;
    reporter.launchId = 'tempLaunchId';
    reporter.suites = new Map([
      [
        suiteName,
        {
          id: 'suiteId',
          name: suiteName,
          testInvocationsLeft: 2,
          descendants: [testId],
          executedTestCount: 0,
        },
      ],
    ]);
  });

  test('both the original and the retried test item get finished', async () => {
    jest
      .spyOn(reporter.client, 'startTestItem')
      .mockReturnValueOnce({ promise: Promise.resolve('ok'), tempId: 'item_0' } as any)
      .mockReturnValueOnce({ promise: Promise.resolve('ok'), tempId: 'item_1' } as any);

    const finishTestItemSpy = jest.spyOn(reporter.client, 'finishTestItem');

    const deferredAttachments = createDeferred<Attachment[]>();
    jest.spyOn(utils, 'getAttachments').mockReturnValue(deferredAttachments.promise);

    const testCase = buildTestCase();

    // @ts-ignore partial TestCase mock
    reporter.onTestBegin(testCase);

    const attempt0End = reporter.onTestEnd(
      // @ts-ignore partial TestCase mock
      testCase,
      // @ts-ignore partial TestResult mock
      {
        status: 'failed',
        attachments: [{ name: 'screenshot', contentType: 'image/png', path: '/x.png' }],
      },
    );
    await Promise.resolve();

    // @ts-ignore partial TestCase mock
    reporter.onTestBegin(testCase);

    deferredAttachments.resolve([]);
    await attempt0End;

    await reporter.onTestEnd(
      // @ts-ignore partial TestCase mock
      testCase,
      // @ts-ignore partial TestResult mock
      { status: 'passed' },
    );

    const finishedIds = finishTestItemSpy.mock.calls.map(([id]) => id);

    expect(finishedIds).toContain('item_0');
    expect(finishedIds).toContain('item_1');
  });
});
