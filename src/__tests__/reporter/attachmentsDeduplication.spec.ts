/*
 *  Copyright 2025 EPAM Systems
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

/*
 * Regression coverage for EPMRPP-121209:
 * "Attachments duplicated while reporting with nested steps".
 *
 * Playwright surfaces the same attachment object in both `step.attachments`
 * and `TestResult.attachments`. Before the fix, `onTestEnd` re-emitted every
 * step-level attachment under the parent test item because the dedup Set was
 * keyed on the post-processed display name (`<testTitle>_<name>`) while
 * `onStepEnd` had keyed by `<stepTitle>_<name>`. The fix keys the dedup Set
 * on the raw Playwright attachment identity (its `path`, with a
 * `name::body.length` fallback for in-memory attachments) and filters
 * `result.attachments` upstream of `getAttachments` in `onTestEnd`.
 *
 * These tests use deterministic values only (no Date.now, Math.random, or
 * random UUIDs). Where UUIDs appear in step ids, they are hard-coded string
 * literals.
 */

import helpers from '@reportportal/client-javascript/helpers';
import { RPReporter } from '../../reporter';
import { mockConfig } from '../mocks/configMock';
import { RPClientMock, mockedDate } from '../mocks/RPClientMock';
import * as utils from '../../utils';

const rootSuite = 'rootSuite';
const suiteName = 'suiteName';
const testItemId = 'testItemId';
const tempTestItemId = 'tempTestItemId';
const stepUuid = 'aaaaaaaa-1111-2222-3333-444444444444';
const nestedStepId = 'nestedStepIdA';

jest.mock('@playwright/test', () => ({
  test: {
    info: () => ({
      annotations: [],
    }),
  },
}));

const buildTestCase = () => ({
  title: 'testTitle',
  id: testItemId,
  parent: {
    title: rootSuite,
    project: () => ({ name: rootSuite }),
    allTests: () => [
      {
        id: testItemId,
        title: 'testTitle',
        titlePath: () => ['', rootSuite, suiteName, 'testTitle'],
      },
    ],
    parent: {
      title: rootSuite,
      project: () => ({ name: rootSuite }),
      allTests: () => [
        {
          id: testItemId,
          title: 'testTitle',
          titlePath: () => ['', rootSuite, suiteName, 'testTitle'],
        },
      ],
    },
  },
  titlePath: () => [rootSuite, suiteName, 'testTitle'],
  annotations: [] as any[],
  _staticAnnotations: [] as any[],
});

const buildStep = () => ({
  title: 'clickGetStarted',
  id: stepUuid,
  titlePath: () => ['clickGetStarted'],
});

// Thin wrappers to bypass the strict `TestCase` / `TestResult` shape checks
// in tests without scattering `@ts-ignore` across multi-line calls.
const callOnStepEnd = (
  reporter: RPReporter,
  testCase: any,
  step: any,
): Promise<void> => (reporter as any).onStepEnd(testCase, undefined, step);

const callOnTestEnd = (
  reporter: RPReporter,
  testCase: any,
  result: any,
): Promise<void> => (reporter as any).onTestEnd(testCase, result);

const seedReporterWithNestedStep = (reporter: RPReporter) => {
  reporter.launchId = 'tempLaunchId';
  reporter.testItems = new Map([[testItemId, { id: tempTestItemId, name: 'testTitle' }]]);
  reporter.suites = new Map([
    [
      rootSuite,
      {
        id: 'rootsuiteId',
        name: rootSuite,
        testInvocationsLeft: 1,
        descendants: [testItemId],
      },
    ],
    [
      `${rootSuite}/${suiteName}`,
      {
        id: 'suiteId',
        name: suiteName,
        testInvocationsLeft: 1,
        descendants: [testItemId],
      },
    ],
  ]);
  reporter.nestedSteps = new Map([
    [`${testItemId}/clickGetStarted-${stepUuid}`, { id: nestedStepId, name: 'clickGetStarted' }],
  ]);
};

describe('attachment deduplication between nested step and parent test (EPMRPP-121209)', () => {
  jest.spyOn(helpers, 'now').mockReturnValue(mockedDate);

  let reporter: RPReporter;
  let getAttachmentsSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    const config = { ...mockConfig, includeTestSteps: true };
    reporter = new RPReporter(config);
    reporter.client = new RPClientMock(config) as unknown as typeof reporter.client;
    seedReporterWithNestedStep(reporter);
  });

  afterEach(() => {
    if (getAttachmentsSpy) {
      getAttachmentsSpy.mockRestore();
    }
  });

  describe('onStepEnd populates stepAttachments with the raw attachment identity', () => {
    test('records the attachment.path as the dedup key (disk-backed attachment)', async () => {
      getAttachmentsSpy = jest.spyOn(utils, 'getAttachments').mockResolvedValue([
        {
          name: 'clickgetstarted_screenshot.png',
          type: 'image/png',
          content: Buffer.from('png-bytes'),
        },
      ]);

      const step = {
        ...buildStep(),
        attachments: [
          {
            name: 'screenshot.png',
            contentType: 'image/png',
            path: '/tmp/pw-artifacts/screenshot.png',
          },
        ],
      };

      await callOnStepEnd(reporter, buildTestCase(), step);

      const keys = reporter.stepAttachments.get(testItemId);
      expect(keys).toBeDefined();
      expect(keys && Array.from(keys)).toEqual(['/tmp/pw-artifacts/screenshot.png']);
    });

    test('records key for every raw attachment even when uploadVideo:false skips the upload', async () => {
      // Reconfigure reporter with uploadVideo disabled.
      const config = { ...mockConfig, includeTestSteps: true, uploadVideo: false };
      reporter = new RPReporter(config);
      reporter.client = new RPClientMock(config) as unknown as typeof reporter.client;
      seedReporterWithNestedStep(reporter);

      // getAttachments would drop the video, so it returns no processed file.
      getAttachmentsSpy = jest.spyOn(utils, 'getAttachments').mockResolvedValue([]);

      const step = {
        ...buildStep(),
        attachments: [
          {
            name: 'video',
            contentType: 'video/webm',
            path: '/tmp/pw-artifacts/video.webm',
          },
        ],
      };

      await callOnStepEnd(reporter, buildTestCase(), step);

      const keys = reporter.stepAttachments.get(testItemId);
      expect(keys && Array.from(keys)).toEqual(['/tmp/pw-artifacts/video.webm']);
    });

    test('uses name::body.length fallback for in-memory (body-backed) attachments', async () => {
      const body = Buffer.from('inline-attachment-body');
      getAttachmentsSpy = jest.spyOn(utils, 'getAttachments').mockResolvedValue([
        {
          name: 'clickgetstarted_custom.txt',
          type: 'text/plain',
          content: body,
        },
      ]);

      const step = {
        ...buildStep(),
        attachments: [
          {
            name: 'custom.txt',
            contentType: 'text/plain',
            body,
          },
        ],
      };

      await callOnStepEnd(reporter, buildTestCase(), step);

      const keys = reporter.stepAttachments.get(testItemId);
      // Fallback key format: `${name}::${body.length}`
      expect(keys && Array.from(keys)).toEqual([`custom.txt::${body.length}`]);
    });

    test('unions keys across multiple onStepEnd invocations on the same test.id', async () => {
      getAttachmentsSpy = jest.spyOn(utils, 'getAttachments').mockResolvedValue([]);

      // Second nested step for the same test.
      const stepUuidB = 'bbbbbbbb-5555-6666-7777-888888888888';
      reporter.nestedSteps.set(`${testItemId}/typeInSearch-${stepUuidB}`, {
        id: 'nestedStepIdB',
        name: 'typeInSearch',
      });

      const stepA = {
        ...buildStep(),
        attachments: [
          { name: 'a.png', contentType: 'image/png', path: '/tmp/a.png' },
        ],
      };
      const stepB = {
        title: 'typeInSearch',
        id: stepUuidB,
        titlePath: () => ['typeInSearch'],
        attachments: [
          { name: 'b.png', contentType: 'image/png', path: '/tmp/b.png' },
        ],
      };

      await callOnStepEnd(reporter, buildTestCase(), stepA);
      await callOnStepEnd(reporter, buildTestCase(), stepB);

      const keys = reporter.stepAttachments.get(testItemId);
      expect(keys && Array.from(keys).sort()).toEqual(['/tmp/a.png', '/tmp/b.png']);
    });
  });

  describe('onTestEnd filters attachments already reported at the step level', () => {
    test('does not re-emit a step attachment that reappears in result.attachments (path-keyed)', async () => {
      // Simulate what onStepEnd would have done: seed the raw-key set.
      reporter.stepAttachments.set(
        testItemId,
        new Set(['/tmp/pw-artifacts/screenshot.png']),
      );

      // getAttachments should only be called with the *test-only* attachment.
      getAttachmentsSpy = jest.spyOn(utils, 'getAttachments').mockResolvedValue([
        {
          name: 'testtitle_video.webm',
          type: 'video/webm',
          content: Buffer.from('video content'),
        },
      ]);
      const sendLogSpy = jest.spyOn(reporter, 'sendLog');

      const resultAttachments = [
        // duplicate of the step-level attachment (same path)
        {
          name: 'screenshot.png',
          contentType: 'image/png',
          path: '/tmp/pw-artifacts/screenshot.png',
        },
        // test-only attachment (video was not captured inside any step)
        {
          name: 'video',
          contentType: 'video/webm',
          path: '/tmp/pw-artifacts/video.webm',
        },
      ];

      await callOnTestEnd(
        reporter,
        { ...buildTestCase(), outcome: () => 'expected' },
        { status: 'passed', attachments: resultAttachments },
      );

      // getAttachments called with the pre-filtered raw array (only the video).
      expect(utils.getAttachments).toHaveBeenCalledTimes(1);
      expect(utils.getAttachments).toHaveBeenCalledWith(
        [resultAttachments[1]],
        { uploadVideo: true, uploadTrace: true },
        'testTitle',
      );

      // Exactly one attachment sendLog under the parent test item — the video.
      const attachmentSendLogs = sendLogSpy.mock.calls.filter(
        ([, opts]) => opts && (opts as any).file,
      );
      expect(attachmentSendLogs).toHaveLength(1);
      expect(attachmentSendLogs[0]).toEqual([
        tempTestItemId,
        {
          message: 'Attachment testtitle_video.webm with type video/webm',
          file: {
            name: 'testtitle_video.webm',
            type: 'video/webm',
            content: Buffer.from('video content'),
          },
        },
      ]);
    });

    test('skips getAttachments entirely when every result.attachment was already reported at step level', async () => {
      reporter.stepAttachments.set(
        testItemId,
        new Set(['/tmp/pw-artifacts/only.png']),
      );

      getAttachmentsSpy = jest.spyOn(utils, 'getAttachments');
      const sendLogSpy = jest.spyOn(reporter, 'sendLog');

      const resultAttachments = [
        {
          name: 'only.png',
          contentType: 'image/png',
          path: '/tmp/pw-artifacts/only.png',
        },
      ];

      await callOnTestEnd(
        reporter,
        { ...buildTestCase(), outcome: () => 'expected' },
        { status: 'passed', attachments: resultAttachments },
      );

      expect(utils.getAttachments).not.toHaveBeenCalled();
      const attachmentSendLogs = sendLogSpy.mock.calls.filter(
        ([, opts]) => opts && (opts as any).file,
      );
      expect(attachmentSendLogs).toHaveLength(0);
    });

    test('deduplicates in-memory attachments via the name::body.length fallback key', async () => {
      const body = Buffer.from('inline-buffer');
      reporter.stepAttachments.set(testItemId, new Set([`custom.txt::${body.length}`]));

      getAttachmentsSpy = jest.spyOn(utils, 'getAttachments');
      const sendLogSpy = jest.spyOn(reporter, 'sendLog');

      // Same logical attachment surfaces in result.attachments — no path, only body.
      const resultAttachments = [
        {
          name: 'custom.txt',
          contentType: 'text/plain',
          body,
        },
      ];

      await callOnTestEnd(
        reporter,
        { ...buildTestCase(), outcome: () => 'expected' },
        { status: 'passed', attachments: resultAttachments },
      );

      expect(utils.getAttachments).not.toHaveBeenCalled();
      const attachmentSendLogs = sendLogSpy.mock.calls.filter(
        ([, opts]) => opts && (opts as any).file,
      );
      expect(attachmentSendLogs).toHaveLength(0);
    });

    test('lets a test-only attachment through even when other attachments were reported at step level', async () => {
      // Screenshot reported inside a step.
      reporter.stepAttachments.set(
        testItemId,
        new Set(['/tmp/pw-artifacts/screenshot.png']),
      );

      getAttachmentsSpy = jest.spyOn(utils, 'getAttachments').mockResolvedValue([
        {
          name: 'testtitle_trace.zip',
          type: 'application/zip',
          content: Buffer.from('trace content'),
        },
      ]);
      const sendLogSpy = jest.spyOn(reporter, 'sendLog');

      const resultAttachments = [
        // duplicate — should be filtered out
        {
          name: 'screenshot.png',
          contentType: 'image/png',
          path: '/tmp/pw-artifacts/screenshot.png',
        },
        // test-level trace — should pass through
        {
          name: 'trace',
          contentType: 'application/zip',
          path: '/tmp/pw-artifacts/trace.zip',
        },
      ];

      await callOnTestEnd(
        reporter,
        { ...buildTestCase(), outcome: () => 'expected' },
        { status: 'passed', attachments: resultAttachments },
      );

      expect(utils.getAttachments).toHaveBeenCalledWith(
        [resultAttachments[1]],
        { uploadVideo: true, uploadTrace: true },
        'testTitle',
      );

      const attachmentSendLogs = sendLogSpy.mock.calls.filter(
        ([, opts]) => opts && (opts as any).file,
      );
      expect(attachmentSendLogs).toHaveLength(1);
      expect(attachmentSendLogs[0][0]).toBe(tempTestItemId);
      expect((attachmentSendLogs[0][1] as any).file.name).toBe('testtitle_trace.zip');
    });
  });

  describe('end-to-end: same attachment on step and test is reported exactly once', () => {
    test('screenshot captured in a nested step is logged under the step and not duplicated under the test', async () => {
      // Mock getAttachments to return a differently-shaped display name for
      // each caller — this is what the old code did, and it is precisely why
      // the pre-fix name-based dedup failed.
      getAttachmentsSpy = jest.spyOn(utils, 'getAttachments').mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async (attachments: any, _cfg: any, testTitle: string) => {
          return attachments.map((a: any) => ({
            name: `${testTitle.toLowerCase()}_${a.name}`,
            type: a.contentType,
            content: Buffer.from('bytes'),
          }));
        },
      );

      const sendLogSpy = jest.spyOn(reporter, 'sendLog');

      const sharedAttachment = {
        name: 'screenshot.png',
        contentType: 'image/png',
        path: '/tmp/pw-artifacts/shared-screenshot.png',
      };

      const step = {
        ...buildStep(),
        attachments: [sharedAttachment],
      };

      // 1. onStepEnd — screenshot recorded under the nested step.
      await callOnStepEnd(reporter, buildTestCase(), step);

      // 2. onTestEnd — Playwright propagates the same attachment into
      //    result.attachments. Without the fix this would fire a second sendLog
      //    under `tempTestItemId`.
      await callOnTestEnd(
        reporter,
        { ...buildTestCase(), outcome: () => 'expected' },
        { status: 'passed', attachments: [sharedAttachment] },
      );

      const attachmentSendLogs = sendLogSpy.mock.calls.filter(
        ([, opts]) => opts && (opts as any).file,
      );

      // Exactly one attachment log — and it lives under the nested step,
      // not under the parent test item.
      expect(attachmentSendLogs).toHaveLength(1);
      expect(attachmentSendLogs[0][0]).toBe(nestedStepId);
      expect(attachmentSendLogs[0][0]).not.toBe(tempTestItemId);
      expect((attachmentSendLogs[0][1] as any).file.name).toBe('clickgetstarted_screenshot.png');
    });

    test('a step-only attachment stays step-only even when the display name would differ between step and test callers', async () => {
      // Same shape as above, but assert on the specific display-name mismatch
      // that produced the original defect: step-caller emits
      // `clickgetstarted_screenshot.png`, test-caller emits
      // `testtitle_screenshot.png`. Both name-based filters would have missed
      // this — only raw-identity dedup catches it.
      getAttachmentsSpy = jest.spyOn(utils, 'getAttachments').mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async (attachments: any, _cfg: any, testTitle: string) => {
          return attachments.map((a: any) => ({
            name: `${testTitle.toLowerCase()}_${a.name}`,
            type: a.contentType,
            content: Buffer.from('bytes'),
          }));
        },
      );

      const sendLogSpy = jest.spyOn(reporter, 'sendLog');

      const attachment = {
        name: 'screenshot.png',
        contentType: 'image/png',
        path: '/tmp/pw-artifacts/regression.png',
      };

      await callOnStepEnd(reporter, buildTestCase(), {
        ...buildStep(),
        attachments: [attachment],
      });

      await callOnTestEnd(
        reporter,
        { ...buildTestCase(), outcome: () => 'expected' },
        { status: 'passed', attachments: [attachment] },
      );

      const emittedFileNames = sendLogSpy.mock.calls
        .filter(([, opts]) => opts && (opts as any).file)
        .map(([, opts]) => (opts as any).file.name);

      // No `testtitle_screenshot.png` on the parent test item.
      expect(emittedFileNames).not.toContain('testtitle_screenshot.png');
      // Exactly one `clickgetstarted_screenshot.png` on the nested step.
      expect(emittedFileNames).toEqual(['clickgetstarted_screenshot.png']);
    });
  });
});
