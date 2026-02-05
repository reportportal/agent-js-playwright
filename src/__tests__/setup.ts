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

jest.mock('@reportportal/client-javascript/lib/helpers', () => ({
  now: jest.fn(() => new Date().valueOf()),
  formatName: jest.fn((name: string) => {
    const MIN = 3;
    const MAX = 256;
    const len = name.length;
    return (len < MIN ? name + new Array(MIN - len + 1).join('.') : name).slice(-MAX);
  }),
  getSystemAttribute: jest.fn(() => []),
  generateTestCaseId: jest.fn((codeRef?: string, params?: any[]) => {
    if (!codeRef) {
      return;
    }
    if (!params) {
      return codeRef;
    }
    const parameters = params.reduce(
      (result, item) => (item.value ? result.concat(item.value) : result),
      [],
    );
    return `${codeRef}[${parameters}]`;
  }),
}));
