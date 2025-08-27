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

  test('should handle all JSON types and not crash', () => {
    const annotations = [{ type: 'rp:setDescription', description: '{invalidJson' }];
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    expect(() => reporter.processAnnotations({ annotations, test: testCase })).not.toThrow();

    expect(reporter.onEventReport).not.toHaveBeenCalled();

    expect(consoleSpy).toHaveBeenCalledWith(
      `[ReportPortal] Skipping annotation with type "rp:setDescription" as description is not valid JSON: "{invalidJson". ` +
        `Only JSON-formatted annotation descriptions are supported for ReportPortal event processing.`,
    );

    consoleSpy.mockRestore();
  });

  test('should handle URL annotations gracefully without crashing', () => {
    const annotations = [
      { type: 'rp:testCaseId', description: 'https://jira.example.com/browse/SPIRE-31613' },
      { type: 'rp:setDescription', description: JSON.stringify('Valid JSON description') },
    ];
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    expect(() => reporter.processAnnotations({ annotations, test: testCase })).not.toThrow();

    expect(reporter.onEventReport).toHaveBeenCalledTimes(1);
    expect(reporter.onEventReport).toHaveBeenCalledWith(
      { type: 'rp:setDescription', data: 'Valid JSON description' },
      testCase,
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      `[ReportPortal] Skipping annotation with type "rp:testCaseId" as description is not valid JSON: "https://jira.example.com/browse/SPIRE-31613". ` +
        `Only JSON-formatted annotation descriptions are supported for ReportPortal event processing.`,
    );

    consoleSpy.mockRestore();
  });

  test('should handle plain text annotations gracefully', () => {
    const annotations = [
      { type: 'rp:customType', description: 'This is plain text' },
      { type: 'rp:anotherType', description: 'Another plain text description' },
    ];
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    expect(() => reporter.processAnnotations({ annotations, test: testCase })).not.toThrow();

    expect(reporter.onEventReport).not.toHaveBeenCalled();

    expect(consoleSpy).toHaveBeenCalledTimes(2);
    expect(consoleSpy).toHaveBeenCalledWith(
      `[ReportPortal] Skipping annotation with type "rp:customType" as description is not valid JSON: "This is plain text". ` +
        `Only JSON-formatted annotation descriptions are supported for ReportPortal event processing.`,
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      `[ReportPortal] Skipping annotation with type "rp:anotherType" as description is not valid JSON: "Another plain text description". ` +
        `Only JSON-formatted annotation descriptions are supported for ReportPortal event processing.`,
    );

    consoleSpy.mockRestore();
  });

  test('should process mixed valid and invalid annotations correctly', () => {
    const annotations = [
      { type: 'rp:addAttributes', description: JSON.stringify([{ key: 'k1', value: 'v1' }]) }, // Valid JSON
      { type: 'rp:invalidType', description: 'https://example.com/test' }, // Invalid JSON (URL)
      { type: 'rp:setDescription', description: JSON.stringify('Valid description') }, // Valid JSON
      { type: 'rp:anotherInvalid', description: 'Plain text' }, // Invalid JSON (plain text)
    ];
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

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

    expect(consoleSpy).toHaveBeenCalledTimes(2);

    consoleSpy.mockRestore();
  });
});
