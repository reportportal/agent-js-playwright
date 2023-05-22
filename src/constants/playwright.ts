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

export enum TEST_ANNOTATION_TYPES {
  FIXME = 'fixme',
  SKIP = 'skip',
  FAIL = 'fail',
}

export enum TEST_OUTCOME_TYPES {
  SKIPPED = 'skipped',
  EXPECTED = 'expected',
  UNEXPECTED = 'unexpected',
  FLAKY = 'flaky',
}

export enum BASIC_ATTACHMENT_CONTENT_TYPES {
  VIDEO = 'video/webm',
  TRACE = 'application/zip',
}

export enum BASIC_ATTACHMENT_NAMES {
  VIDEO = 'video',
  TRACE = 'trace',
}

export type TestAnnotation = { type: string; description?: string };

export type TestOutcome = 'skipped' | 'expected' | 'unexpected' | 'flaky';
