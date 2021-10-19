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
      key: 'key',
      value: 'Top_level_suite_1',
    },
    {
      value: 'Top_level_suite_1',
    },
  ], 'Top level suite');
  ReportingApi.addAttributes([
    {
      value: 'Top_level_suite_2',
    },
  ], 'Top level suite');
  ReportingApi.setDescription('Description for top level suite_1', 'Top level suite');
  ReportingApi.setDescription('Description for top level suite_2', 'Top level suite');
  test.describe('Bottom level suite', () => {
    ReportingApi.addAttributes([
      {
        value: 'Bottom_level_suite_1',
      },
    ], 'Bottom level suite');
    ReportingApi.addAttributes([
      {
        value: 'Bottom_level_suite_2',
      },
    ], 'Bottom level suite');
    ReportingApi.setDescription('Description for bottom level suite_1', 'Bottom level suite');
    ReportingApi.setDescription('Description for bottom level suite_2', 'Bottom level suite');
    test('Test should be passed', async ({ page }) => {
      ReportingApi.addAttributes([
        {
          value: 'Test_should_be_passed_1',
        },
      ]);
      ReportingApi.addAttributes([
        {
          value: 'Test_should_be_passed_2',
        },
      ]);
      ReportingApi.setDescription('Description for testItem_1');
      ReportingApi.setDescription('Description for testItem_2');
      await page.goto('https://playwright.dev/');
      const title = page.locator('.navbar__inner .navbar__title');
      await expect(title).toHaveText('Playwright');
    });

  })

  test.describe('second bottom level suite', () => {
    ReportingApi.addAttributes([
      {
        value: 'second bottom level suite_1',
      },
    ], 'second bottom level suite');
    ReportingApi.addAttributes([
      {
        value: 'second bottom level suite_2',
      },
    ], 'second bottom level suite');
    ReportingApi.setDescription('Description for second bottom level suite_1', 'second bottom level suite');
    ReportingApi.setDescription('Description for second bottom level suite_2', 'second bottom level suite');
    test('Test should be failed', async ({ page }) => {
      await expect('net').toHaveText('Playwright');
    });
  })
});
