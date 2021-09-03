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

declare namespace Interfaces {
  interface Attribute {
    value: string;
    key?: string;
    system?: boolean;
  }

  interface Attachment {
    name: string;
    type: string;
    content: string | Buffer;
  }

  interface LogRQ {
    level?: string;
    message?: string;
    time?: number;
    file?: Attachment;
  }

  interface ObjUniversal {
    [name: string]: string;
  }
}
