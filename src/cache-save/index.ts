import * as core from '@actions/core';
import { Inputs } from '../inputs';
import { runSaveCache } from './run';

export async function saveCache(inputs: Inputs) {
  if (!inputs.cache) return

  try {
    await runSaveCache();
  } catch (error) {
    core.setFailed((error as Error).message);
  }
}

export default saveCache
