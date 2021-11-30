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

import { expect, test } from '@playwright/test';
import { ReportingApi } from '../../src/reportingApi';
import { LOG_LEVELS } from '../../src/constants/logLevels';

const fs = require('fs');
const path = require('path');

const attachments = [
  {
    filename: 'test.jpg',
    type: 'image/jpg',
  },
  {
    filename: 'test.png',
    type: 'image/png',
  },
  {
    filename: 'test.html',
    type: 'text/html',
  },
  {
    filename: 'test.json',
    type: 'application/json',
  },
  {
    filename: 'test.css',
    type: 'application/css',
  },
  {
    filename: 'test.mp4',
    type: 'video/mp4',
  },
];

test.describe('logs for suite/test', () => {
  ReportingApi.launchLog(LOG_LEVELS.INFO, 'launch log with manually specified info level');
  ReportingApi.launchInfo('info launch log');
  ReportingApi.launchDebug('debug launch log');
  ReportingApi.launchTrace('trace launch log');
  ReportingApi.launchWarn('warn launch log');
  ReportingApi.launchError('error launch log');
  ReportingApi.launchFatal('fatal launch log');

  ReportingApi.info('INFO log for suite', undefined, 'logs for suite/test');
  ReportingApi.debug( 'DEBUG log for suite', undefined, 'logs for suite/test');
  ReportingApi.trace('TRACE log for suite', undefined, 'logs for suite/test');
  ReportingApi.warn('WARN log for suite', undefined, 'logs for suite/test');
  ReportingApi.error( 'ERROR log for suite', undefined, 'logs for suite/test');
  ReportingApi.fatal( 'FATAL log for suite', undefined, 'logs for suite/test');


  test('test should be failed', () => {
    ReportingApi.setDescription('description for test with logs')
    ReportingApi.info( 'INFO log for test');
    ReportingApi.debug( 'DEBUG log for test');
    ReportingApi.trace('TRACE log for test');
    ReportingApi.warn( 'WARN log for test');
    ReportingApi.error( 'ERROR log for test');
    ReportingApi.fatal( 'FATAL log for test');

    expect(false).toBe(true);
  });


  test('should contain logs with attachments',  async () => {
    ReportingApi.setDescription('description for test with attachments')
    const readFilesPromises = attachments.map(
      ({ filename, type }) =>
        new Promise<void>((resolve, reject) =>
          fs.readFile(path.resolve(__dirname, './attachments', filename), (err: any, data: any) => {
            if (err) {
              reject(err);
            }
            const attachment = {
              name: filename,
              type,
              content: data.toString('base64'),
            };
            ReportingApi.info('info log with attachment', attachment);
            resolve();
          }),
        ),
    );
    await Promise.all(readFilesPromises);

    await expect(true).toBe(true);
  })
});
