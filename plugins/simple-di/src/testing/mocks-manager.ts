/**
 * @license
 * Copyright Andrey Chalkin <L2jLiga@gmail.com> (https://github.com/L2jLiga). All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/L2jLiga/fastify-decorators/blob/master/LICENSE
 */

import type { Injectables } from '../interfaces/injectable-class.js';
import { wrapInjectable } from '../utils/wrap-injectable.js';
import type { ServiceMock } from './service-mock.js';

export class MocksManager {
  static create(injectables: Injectables, mocks: ServiceMock[] = []): Injectables {
    const mocksMap: Injectables = new Map(injectables);

    for (const { provide, useValue } of mocks) {
      mocksMap.set(provide, wrapInjectable(useValue));
    }

    return mocksMap;
  }
}
