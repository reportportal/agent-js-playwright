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

import path from 'path';
import fs from 'fs';
import { ReportPortalConfig } from './models';
import { RP_CONFIG_FILE_NAME } from './constants';

export const getConfig = (providedConfig?: ReportPortalConfig): ReportPortalConfig => {
  try {
    if (!providedConfig || Object.keys(providedConfig).length === 0) {
      return JSON.parse(fs.readFileSync(path.resolve(RP_CONFIG_FILE_NAME)).toString());
    }
  } catch (e) {
    console.error('Cannot correctly parse RP options from rp.json file.', e);
  }

  return providedConfig;
};
