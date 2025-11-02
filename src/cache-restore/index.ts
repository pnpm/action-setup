import * as cache from '@actions/cache';
import * as core from '@actions/core';
import { runRestoreCache } from './run';
import { Inputs } from '../inputs';

export async function restoreCache(inputs: Inputs) {
  if (!inputs.cache) return

  if (!cache.isFeatureAvailable()) {
    core.warning('Cache is not available, skipping cache restoration')
    return
  }

  core.startGroup('Restoring cache...')
  await runRestoreCache(inputs);
  core.endGroup();
}

export default restoreCache
