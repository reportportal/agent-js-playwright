/*
 *  Copyright 2023 EPAM Systems
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

import { EVENTS } from '@reportportal/client-javascript/lib/constants/events';

export enum RPTestInfo {
  STATUS = 'status',
  ATTRIBUTES = 'attributes',
  DESCRIPTION = 'description',
  TEST_CASE_ID = 'testCaseId',
}

export const RpEventsToAdditionalInfoMap = {
  [EVENTS.ADD_ATTRIBUTES]: RPTestInfo.ATTRIBUTES,
  [EVENTS.SET_DESCRIPTION]: RPTestInfo.DESCRIPTION,
  [EVENTS.SET_TEST_CASE_ID]: RPTestInfo.TEST_CASE_ID,
  [EVENTS.SET_STATUS]: RPTestInfo.STATUS,
};
