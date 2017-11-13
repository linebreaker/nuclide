/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {HasteSettings} from '../getConfig';
import type {JSExport} from './types';

import crypto from 'crypto';
import nuclideUri from 'nuclide-commons/nuclideUri';
import os from 'os';
import DiskCache from '../../../commons-node/DiskCache';
import {serializeHasteSettings} from '../getConfig';

const CACHE_DIR = nuclideUri.join(os.tmpdir(), 'nuclide-js-imports-cache');
const CACHE_VERSION = 1; // Bump this for any breaking changes.

export type CacheParams = {
  root: string,
  hasteSettings: HasteSettings,
};

export type FileWithHash = {
  filePath: string,
  sha1: string,
};

function getCachePath({root, hasteSettings}: CacheParams): string {
  const hash = crypto.createHash('sha1');
  hash.update(`${root}:${CACHE_VERSION}\n`);
  // Should cover all fields in HasteSettings. Sadly, it's not JSON-serializable.
  hash.update(serializeHasteSettings(hasteSettings));
  const fileName =
    nuclideUri.basename(root) + '-' + hash.digest('hex').substr(0, 8);
  return nuclideUri.join(CACHE_DIR, fileName);
}

function getCacheKey({filePath, sha1}: FileWithHash) {
  // We can truncate the sha1 hash, as collisions are very unlikely.
  return `${filePath}:${sha1.substr(0, 8)}`;
}

export default class ExportCache extends DiskCache<
  FileWithHash,
  Array<JSExport>,
> {
  constructor(params: CacheParams) {
    super(getCachePath(params), getCacheKey);
  }
}