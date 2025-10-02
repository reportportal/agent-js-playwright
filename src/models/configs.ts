/*
 *  Copyright 2022 EPAM Systems
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

import { AxiosRequestConfig } from 'axios';
import { IAxiosRetryConfig } from 'axios-retry';
import { AgentOptions } from 'https';

import { Attribute } from './common';
import { LAUNCH_MODES } from '../constants';

export interface RestClientConfig extends AxiosRequestConfig {
  agent?: AgentOptions;
  retry?: number | IAxiosRetryConfig;
}

interface ClientConfig {
  apiKey: string;
  project: string;
  endpoint: string;
  launch: string;

  debug?: boolean;
  isLaunchMergeRequired?: boolean; // not used for this agent
  restClientConfig?: RestClientConfig;
  headers?: Record<string, string>;
  launchUuidPrint?: boolean;
  launchUuidPrintOutput?: string;
}

export interface AttachmentsConfig {
  uploadVideo?: boolean;
  uploadTrace?: boolean;
}

export interface ReportPortalConfig extends ClientConfig, AttachmentsConfig {
  // common options
  launchId?: string;
  attributes?: Array<Attribute>;
  description?: string;
  rerun?: boolean;
  rerunOf?: string;
  mode?: LAUNCH_MODES;

  // agent specific options
  skippedIssue?: boolean;
  includeTestSteps?: boolean;
  includePlaywrightProjectNameToCodeReference?: boolean;
  extendTestDescriptionWithLastError?: boolean;
}
