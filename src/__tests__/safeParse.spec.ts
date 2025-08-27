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
 *
 */

import { safeParse } from '../utils';

describe('safeParse', () => {
  describe('Non-string inputs', () => {
    test('should return numbers as-is', () => {
      expect(safeParse(42)).toBe(42);
      expect(safeParse(0)).toBe(0);
      expect(safeParse(-1)).toBe(-1);
      expect(safeParse(3.14)).toBe(3.14);
    });

    test('should return booleans as-is', () => {
      expect(safeParse(true)).toBe(true);
      expect(safeParse(false)).toBe(false);
    });

    test('should return null as-is', () => {
      expect(safeParse(null)).toBe(null);
    });

    test('should return undefined as-is', () => {
      expect(safeParse(undefined)).toBe(undefined);
    });

    test('should return objects as-is', () => {
      const obj = { key: 'value' };
      expect(safeParse(obj)).toBe(obj);
      expect(safeParse(obj)).toEqual({ key: 'value' });
    });

    test('should return arrays as-is', () => {
      const arr = [1, 2, 3];
      expect(safeParse(arr)).toBe(arr);
      expect(safeParse(arr)).toEqual([1, 2, 3]);
    });
  });

  describe('Valid JSON strings', () => {
    test('should parse valid JSON objects', () => {
      const jsonString = '{"key": "value", "number": 42}';
      const expected = { key: 'value', number: 42 };
      expect(safeParse(jsonString)).toEqual(expected);
    });

    test('should parse valid JSON arrays', () => {
      const jsonString = '[1, 2, 3, "four"]';
      const expected = [1, 2, 3, 'four'];
      expect(safeParse(jsonString)).toEqual(expected);
    });

    test('should parse JSON strings', () => {
      expect(safeParse('"hello"')).toBe('hello');
      expect(safeParse('""')).toBe('');
    });

    test('should parse JSON numbers', () => {
      expect(safeParse('42')).toBe(42);
      expect(safeParse('0')).toBe(0);
      expect(safeParse('-1')).toBe(-1);
      expect(safeParse('3.14')).toBe(3.14);
    });

    test('should parse JSON booleans', () => {
      expect(safeParse('true')).toBe(true);
      expect(safeParse('false')).toBe(false);
    });

    test('should parse JSON null', () => {
      expect(safeParse('null')).toBe(null);
    });

    test('should parse complex nested JSON', () => {
      const jsonString =
        '{"users": [{"id": 1, "name": "John"}, {"id": 2, "name": "Jane"}], "count": 2}';
      const expected = {
        users: [
          { id: 1, name: 'John' },
          { id: 2, name: 'Jane' },
        ],
        count: 2,
      };
      expect(safeParse(jsonString)).toEqual(expected);
    });

    test('should parse JSON with special characters', () => {
      const jsonString = '{"url": "https://example.com/path?param=value", "emoji": "🎉"}';
      const expected = { url: 'https://example.com/path?param=value', emoji: '🎉' };
      expect(safeParse(jsonString)).toEqual(expected);
    });
  });

  describe('ReportPortal specific use cases', () => {
    test('should parse ReportPortal attributes JSON', () => {
      const attributesJson = '[{"key": "priority", "value": "high"}, {"value": "demo"}]';
      const expected = [{ key: 'priority', value: 'high' }, { value: 'demo' }];
      expect(safeParse(attributesJson)).toEqual(expected);
    });

    test('should parse ReportPortal description JSON', () => {
      const descriptionJson = '"This is a test description"';
      expect(safeParse(descriptionJson)).toBe('This is a test description');
    });

    test('should parse ReportPortal log JSON', () => {
      const logJson = '{"level": "INFO", "message": "Test log", "file": {"name": "test.png"}}';
      const expected = {
        level: 'INFO',
        message: 'Test log',
        file: { name: 'test.png' },
      };
      expect(safeParse(logJson)).toEqual(expected);
    });

    test('should handle ReportPortal annotation with URL', () => {
      const url = 'https://jira.example.com/browse/SPIRE-31613';
      expect(safeParse(url)).toBe(url);
    });

    test('should handle ReportPortal annotation with plain text (invalid JSON)', () => {
      const plainText = 'This test covers user authentication';
      expect(safeParse(plainText)).toBe(plainText); // Should return as-is, not crash
    });
  });
});
