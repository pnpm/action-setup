import * as core from '@actions/core';
import * as cache from '@actions/cache';

export async function runSaveCache() {
  const state = core.getState('cache_restored_key');
  const primaryKey = core.getState('cache_primary_key');
  const cachePath = core.getState('cache_path');

  if (primaryKey === state) {
    core.info(`Cache hit occurred on the primary key ${primaryKey}, not saving cache.`);
    return;
  }

  const cacheId = await cache.saveCache([cachePath], primaryKey);
  if (cacheId == -1) return;

  core.info(`Cache saved with the key: ${primaryKey}`);
}
