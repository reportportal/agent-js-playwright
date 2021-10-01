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

import { test, expect } from '@playwright/test';
import { ReportingApi } from '../../src/reportingApi';

test.describe('Top level suite', () => {
  ReportingApi.addAttributes([
    {
      key: 'suitekey',
      value: 'suitevalue',
    },
  ]);
  test.describe('Bottom level suite', () => {
    ReportingApi.addAttributes([
      {
        key: 'suitekey2',
        value: 'suitevalue2',
      },
    ]);
    test('Test should be passed', async ({ page }) => {
      ReportingApi.addAttributes([
        {
          key: 'key',
          value: 'value',
        },
      ]);
      await page.goto('https://playwright.dev/');
      const title = page.locator('.navbar__inner .navbar__title');
      await expect(title).toHaveText('Playwright');
    });

  })

  test.describe('second bottom level suite', () => {
    ReportingApi.addAttributes([
      {
        key: 'suitekey3',
        value: 'suitevalue3',
      },
    ]);
    test('Test should be failed', async ({ page }) => {
      await expect('net').toHaveText('Playwright');
    });
  })
});
