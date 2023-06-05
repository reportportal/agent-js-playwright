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

import { Attribute, Issue } from './common';
import { TEST_ITEM_TYPES, LOG_LEVELS, LAUNCH_MODES } from '../constants';

export interface StartLaunchObjType {
  startTime?: Date | number;
  attributes?: Array<Attribute>;
  description?: string;
  name?: string;
  rerun?: boolean;
  rerunOf?: string;
  mode?: LAUNCH_MODES;
  id?: string;
}

export interface StartTestObjType {
  name: string;
  type: TEST_ITEM_TYPES;
  attributes?: Array<Attribute>;
  description?: string;
  startTime?: Date | number;
  codeRef?: string;
  testCaseId?: string;
  retry?: boolean;
}

export interface FinishTestItemObjType {
  endTime?: Date | number;
  status?: string;
  attributes?: Attribute[];
  description?: string;
  testCaseId?: string;
  issue?: Issue;
}

export interface Attachment {
  name: string;
  type: string;
  content: string | Buffer;
}

export interface LogRQ {
  level?: LOG_LEVELS;
  message?: string;
  time?: number;
  file?: Attachment;
}
