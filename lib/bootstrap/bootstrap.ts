/**
 * @license
 * Copyright Andrey Chalkin <L2jLiga@gmail.com> (https://github.com/L2jLiga). All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/L2jLiga/fastify-decorators/blob/master/LICENSE
 */

import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { opendirSync } from 'fs';
import { join } from 'path';
import { pathToFileURL } from 'url';
import type { AutoLoadConfig } from '../interfaces/bootstrap-config.js';
import { Constructable } from '../interfaces/constructable.js';
import type { BootstrapConfig } from '../interfaces/index.js';
import { hooksRegistry } from '../plugins/life-cycle.js';
import { Registrable } from '../plugins/shared-interfaces.js';
import { CREATOR } from '../symbols/index.js';
import { transformAndWait } from '../utils/transform-and-wait.js';

const defaultMask = /\.(handler|controller)\./;

export const bootstrap: FastifyPluginAsync<BootstrapConfig> = fp<BootstrapConfig>(
  async (fastify, config) => {
    await transformAndWait(hooksRegistry.appInit, (hook) => hook(fastify));

    const controllers = new Set<Constructable<unknown>>();
    if ('directory' in config) for await (const controller of autoLoadModules(config)) controllers.add(controller);
    if ('controllers' in config) config.controllers.forEach(controllers.add, controllers);

    await transformAndWait(controllers, loadController.bind(fastify, config));
    await transformAndWait(hooksRegistry.appReady, (hook) => hook(fastify));

    fastify.addHook('onClose', () => transformAndWait(hooksRegistry.appDestroy, (hook) => hook(fastify)));
  },
  {
    fastify: '^3.0.0',
    name: 'fastifyDecorators',
  },
);

function autoLoadModules(config: AutoLoadConfig): AsyncIterable<Constructable<unknown>> {
  const flags = config.mask instanceof RegExp ? config.mask.flags.replace('g', '') : '';
  const filter = config.mask ? new RegExp(config.mask, flags) : defaultMask;

  return readModulesRecursively(config.directory, filter);
}

async function* readModulesRecursively(path: string, filter: RegExp): AsyncIterable<Constructable<unknown>> {
  const dir = opendirSync(path);

  try {
    while (true) {
      const dirent = await dir.read();
      if (dirent == null) return;

      const fullFilePath = join(path, dirent.name);

      if (dirent.isDirectory()) {
        yield* readModulesRecursively(fullFilePath, filter);
      } else if (filter.test(dirent.name)) {
        yield import(pathToFileURL(fullFilePath).toString()).then((m) => m.default);
      }
    }
  } finally {
    await dir.close();
  }
}

function loadController(this: FastifyInstance, config: BootstrapConfig, controller: Constructable<unknown>) {
  if (verifyController(controller)) {
    return controller[CREATOR].register(this, config.prefix);
  } else if (!config.skipBroken) {
    throw new TypeError(`Loaded file is incorrect module and can not be bootstrapped: ${controller}`);
  }
}

function verifyController(controller: Constructable<unknown>): controller is Registrable {
  return controller && CREATOR in controller;
}
