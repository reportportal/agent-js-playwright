import helpers from '@reportportal/client-javascript/lib/helpers';
import { RPReporter } from '../../reporter';
import { mockConfig } from '../mocks/configMock';
import { RPClientMock, mockedDate } from '../mocks/RPClientMock';
import { FinishTestItemObjType } from '../../models';
import { STATUSES } from '../../constants';

const rootSuite = 'rootSuite';
const suiteName = 'suiteName';

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
    reporter.config.skippedIssue = true;
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

  test('client.finishTestItem should be called with issueType NOT_ISSUE', async () => {
    reporter.config.skippedIssue = false;
    const result = {
      status: 'skipped',
    };
    const finishTestItemObj: FinishTestItemObjType = {
      endTime: mockedDate,
      status: result.status,
      attributes: [{ key: 'key', value: 'value' }],
      description: 'description',
      issue: { issueType: 'NOT_ISSUE' },
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
});
