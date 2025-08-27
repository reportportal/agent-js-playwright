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

    reporter.processAnnotations({ annotations, test: testCase });

    expect(reporter.onEventReport).toHaveBeenCalledTimes(2);

    expect(reporter.onEventReport).toHaveBeenCalledWith(
      { type: 'rp:addAttributes', data: [{ key: 'k', value: 'v' }] },
      testCase,
    );

    expect(reporter.onEventReport).toHaveBeenCalledWith(
      { type: 'rp:setDescription', data: 'My description' },
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
      { type: '', description: JSON.stringify('desc') },
      { type: 'rp:setStatus', description: '' },
    ];

    reporter.processAnnotations({ annotations, test: testCase });

    expect(reporter.onEventReport).toHaveBeenCalledTimes(1);
    expect(reporter.onEventReport).toHaveBeenCalledWith(
      { type: 'rp:addAttributes', data: [{ key: 'k', value: 'v' }] },
      testCase,
    );
  });

  test('should handle invalid JSON and not crash', () => {
    const annotations = [{ type: 'rp:setDescription', description: '{invalidJson' }];

    expect(() => reporter.processAnnotations({ annotations, test: testCase })).not.toThrow();
    expect(reporter.onEventReport).toHaveBeenCalledTimes(1);
    expect(reporter.onEventReport).toHaveBeenCalledWith(
      { type: 'rp:setDescription', data: '{invalidJson' },
      testCase,
    );
  });

  test('should handle URL annotations without crashing', () => {
    const annotations = [
      { type: 'rp:setTestCaseId', description: 'https://jira.example.com/browse/SPIRE-31613' },
      { type: 'rp:setDescription', description: JSON.stringify('Valid JSON description') },
    ];

    expect(() => reporter.processAnnotations({ annotations, test: testCase })).not.toThrow();

    expect(reporter.onEventReport).toHaveBeenCalledTimes(2);
    expect(reporter.onEventReport).toHaveBeenCalledWith(
      { type: 'rp:setTestCaseId', data: 'https://jira.example.com/browse/SPIRE-31613' },
      testCase,
    );
    expect(reporter.onEventReport).toHaveBeenCalledWith(
      { type: 'rp:setDescription', data: 'Valid JSON description' },
      testCase,
    );
  });

  test('should skip non-ReportPortal event types', () => {
    const annotations = [
      { type: 'rp:customType', description: 'This is plain text' },
      { type: 'rp:anotherType', description: 'Another plain text description' },
    ];

    expect(() => reporter.processAnnotations({ annotations, test: testCase })).not.toThrow();

    expect(reporter.onEventReport).not.toHaveBeenCalled();
  });

  test('should process only valid ReportPortal event types', () => {
    const annotations = [
      { type: 'rp:addAttributes', description: JSON.stringify([{ key: 'k1', value: 'v1' }]) },
      { type: 'rp:invalidType', description: 'https://example.com/test' },
      { type: 'rp:setDescription', description: JSON.stringify('Valid description') },
      { type: 'rp:anotherInvalid', description: 'Plain text' },
    ];

    expect(() => reporter.processAnnotations({ annotations, test: testCase })).not.toThrow();

    expect(reporter.onEventReport).toHaveBeenCalledTimes(2);
    expect(reporter.onEventReport).toHaveBeenCalledWith(
      { type: 'rp:addAttributes', data: [{ key: 'k1', value: 'v1' }] },
      testCase,
    );
    expect(reporter.onEventReport).toHaveBeenCalledWith(
      { type: 'rp:setDescription', data: 'Valid description' },
      testCase,
    );
  });
});
