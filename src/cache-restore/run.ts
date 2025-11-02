import * as cache from '@actions/cache';
import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as glob from '@actions/glob';
import os from 'os';
import { Inputs } from '../inputs';

export async function runRestoreCache(inputs: Inputs) {
  const cachePath = await getCacheDirectory();
  core.saveState('cache_path', cachePath);

  const fileHash = await glob.hashFiles(inputs.cacheDependencyPath);
  if (!fileHash) {
    throw new Error('Some specified paths were not resolved, unable to cache dependencies.');
  }

  const primaryKey = `pnpm-cache-${process.env.RUNNER_OS}-${os.arch()}-${fileHash}`;
  core.debug(`Primary key is ${primaryKey}`);
  core.saveState('cache_primary_key', primaryKey);

  let cacheKey = await cache.restoreCache([cachePath], primaryKey);

  core.setOutput('cache-hit', Boolean(cacheKey));

  if (!cacheKey) {
    core.info(`Cache is not found`);
    return;
  }

  core.saveState('cache_restored_key', cacheKey)
  core.info(`Cache restored from key: ${cacheKey}`)
}

async function getCacheDirectory() {
  const { stdout } = await exec.getExecOutput('pnpm store path --silent')
  const cacheFolderPath = stdout.trim()
  core.debug(`Cache folder is set to "${cacheFolderPath}"`)
  return cacheFolderPath;
};
