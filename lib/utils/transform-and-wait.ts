/**
 * @license
 * Copyright Andrey Chalkin <L2jLiga@gmail.com> (https://github.com/L2jLiga). All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/L2jLiga/fastify-decorators/blob/master/LICENSE
 */

export const transformAndWait = async <Item>(collection: Iterable<Item>, mapFn: (arg: Item) => unknown | Promise<unknown>): Promise<void> => {
  await Promise.all([...collection].map(mapFn));
};
