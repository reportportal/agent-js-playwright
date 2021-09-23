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

import { PlaywrightTestConfig } from '@playwright/test';

const RPconfig = {
  'token': '00000000-0000-0000-0000-000000000000',
  'endpoint': 'http://dev.epm-rpp.projects.epam.com:8080/api/v1',
  'project': 'Your project',
  'launch': 'Playwright test',
  'attributes': [
    {
      'key': 'key',
      'value': 'value',
    },
    {
      'value': 'value',
    },
  ],
  'description': 'Your launch description',
};

const config: PlaywrightTestConfig = {
  // reporter: [[require.resolve('@reportportal/agent-js-playwright'), RPconfig]],
  reporter: [['../src/reporter', RPconfig]],
  testDir: './tests',
};
export default config;
