import { RPReporter } from '../../reporter';
import { mockConfig } from '../mocks/configMock';
import { RPClientMock } from '../mocks/RPClientMock';
import { TestCase } from '@playwright/test/reporter';

describe('processAnnotations', () => {
  let reporter: RPReporter;
  let testCase: TestCase;

  beforeEach(() => {
    reporter = new RPReporter(mockConfig);
    reporter.client = new RPClientMock(mockConfig);
    testCase = <TestCase>{
      title: 'testTitle',
      id: 'testItemId',
      titlePath: () => ['rootSuite', 'suiteName', 'testTitle'],
    };
    jest.spyOn(reporter, 'onEventReport').mockImplementation(() => {});
  });

  test('should call onEventReport for each valid annotation', () => {
    const annotations = [
      { type: 'rp:addAttributes', description: JSON.stringify([{ key: 'k', value: 'v' }]) },
      { type: 'rp:setDescription', description: JSON.stringify('My description') },
    ];

    reporter.processAnnotations({ annotations, test: testCase, suiteName: 'suiteA' });

    expect(reporter.onEventReport).toHaveBeenCalledTimes(2);

    expect(reporter.onEventReport).toHaveBeenCalledWith(
      { type: 'rp:addAttributes', data: [{ key: 'k', value: 'v' }], suiteName: 'suiteA' },
      testCase,
    );

    expect(reporter.onEventReport).toHaveBeenCalledWith(
      { type: 'rp:setDescription', data: 'My description', suiteName: 'suiteA' },
      testCase,
    );
  });

  test('should call onEventReport without suiteName if suiteName not provided', () => {
    const annotations = [{ type: 'rp:setStatus', description: JSON.stringify('FAILED') }];

    reporter.processAnnotations({ annotations, test: testCase });

    expect(reporter.onEventReport).toHaveBeenCalledWith(
      { type: 'rp:setStatus', data: 'FAILED' },
      testCase,
    );
  });

  test('should skip annotations missing type or description', () => {
    const annotations = [
      { type: 'rp:addAttributes', description: JSON.stringify([{ key: 'k', value: 'v' }]) },
      { type: '', description: JSON.stringify('desc') }, // missing type
      { type: 'rp:setStatus', description: '' }, // missing description
    ];

    reporter.processAnnotations({ annotations, test: testCase });

    expect(reporter.onEventReport).toHaveBeenCalledTimes(1);
    expect(reporter.onEventReport).toHaveBeenCalledWith(
      { type: 'rp:addAttributes', data: [{ key: 'k', value: 'v' }] },
      testCase,
    );
  });

  test('should throw if description is invalid JSON', () => {
    const annotations = [{ type: 'rp:setDescription', description: '{invalidJson' }];

    expect(() => reporter.processAnnotations({ annotations, test: testCase })).toThrow(SyntaxError);
  });
});
