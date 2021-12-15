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
 *
 */

// @ts-ignore
import { name as pjsonName, version as pjsonVersion } from '../../../package.json';
import {
  getAgentInfo,
  getCodeRef,
  getSystemAttributes,
  promiseErrorHandler,
  sendEventToReporter,
} from '../../utils';
import path from 'path';
import { TEST_ITEM_TYPES } from '../../constants';

describe('testing utils', () => {
  test('promiseErrorHandler', async () => {
    const log = jest.spyOn(console, 'error');
    const promiseWithError = Promise.reject('error message');
    await promiseErrorHandler(promiseWithError, 'Failed to finish suite');

    expect(log).toBeCalledTimes(1);
    expect(log).toBeCalledWith('Failed to finish suite', 'error message');
  });

  describe('getAgentInfo', () => {
    test('should return the name and version of application from package.json file', () => {
      const agentInfo = getAgentInfo();

      expect(agentInfo.name).toBe(pjsonName);
      expect(agentInfo.version).toBe(pjsonVersion);
    });
  });

  describe('getSystemAttributes', () => {
    const expectedRes = [
      {
        key: 'agent',
        value: `${pjsonName}|${pjsonVersion}`,
        system: true,
      },
    ];
    test('should return the list of system attributes', () => {
      const systemAttributes = getSystemAttributes();

      expect(systemAttributes).toEqual(expectedRes);
    });

    test('should return expected list of system attributes in case skippedIssue=false', () => {
      const systemAttributes = getSystemAttributes(false);
      const skippedIssueAttribute = {
        key: 'skippedIssue',
        value: 'false',
        system: true,
      };

      expect(systemAttributes).toEqual([...expectedRes, skippedIssueAttribute]);
    });
  });

  describe('getCodeRef', () => {
    jest.spyOn(process, 'cwd').mockImplementation(() => `C:${path.sep}testProject`);
    const mockedTest = {
      location: {
        file: `C:${path.sep}testProject${path.sep}test${path.sep}example.js`,
        line: 5,
        column: 3,
      },
      titlePath: () => ['example.js', 'rootDescribe', 'parentDescribe', 'testTitle'],
    };

    test('codeRef should be correct for TEST_ITEM_TYPES.SUITE', () => {
      const expectedCodeRef = `test/example.js/rootDescribe`;
      const codeRef = getCodeRef(mockedTest, TEST_ITEM_TYPES.SUITE);

      expect(codeRef).toEqual(expectedCodeRef);
    });

    test('codeRef should be correct for TEST_ITEM_TYPES.TEST', () => {
      const expectedCodeRef = `test/example.js/rootDescribe/parentDescribe`;
      const codeRef = getCodeRef(mockedTest, TEST_ITEM_TYPES.TEST);

      expect(codeRef).toEqual(expectedCodeRef);
    });

    test('codeRef should be correct for TEST_ITEM_TYPES.STEP', () => {
      const expectedCodeRef = `test/example.js/rootDescribe/parentDescribe/testTitle`;
      const codeRef = getCodeRef(mockedTest, TEST_ITEM_TYPES.STEP);

      expect(codeRef).toEqual(expectedCodeRef);
    });
  });
  describe('sendEventToReporter', () => {
    test('func must send event to reporter', () => {
      const type = 'ADD_ATTRIBUTES';
      const data = [
        {
          key: 'key',
          value: 'value',
        },
      ];
      const spyProcess = jest.spyOn(process.stdout, 'write');
      sendEventToReporter(type, data);
      expect(spyProcess).toHaveBeenCalledWith(JSON.stringify({ type, data }));
    });
  });
});
