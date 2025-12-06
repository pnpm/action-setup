import { restoreCache } from '@actions/cache'
import { debug, info, saveState, setOutput } from '@actions/core'
import { getExecOutput } from '@actions/exec'
import { hashFiles } from '@actions/glob'
import os from 'os'
import { Inputs } from '../inputs'

export async function runRestoreCache(inputs: Inputs) {
  const cachePath = await getCacheDirectory()
  saveState('cache_path', cachePath)

  const fileHash = await hashFiles(inputs.cacheDependencyPath)
  if (!fileHash) {
    throw new Error('Some specified paths were not resolved, unable to cache dependencies.')
  }

  const primaryKey = `pnpm-cache-${process.env.RUNNER_OS}-${os.arch()}-${fileHash}`
  debug(`Primary key is ${primaryKey}`)
  saveState('cache_primary_key', primaryKey)

  let cacheKey = await restoreCache([cachePath], primaryKey)

  setOutput('cache-hit', Boolean(cacheKey))

  if (!cacheKey) {
    info(`Cache is not found`)
    return
  }

  saveState('cache_restored_key', cacheKey)
  info(`Cache restored from key: ${cacheKey}`)
}

async function getCacheDirectory() {
  const { stdout } = await getExecOutput('pnpm store path --silent')
  const cacheFolderPath = stdout.trim()
  debug(`Cache folder is set to "${cacheFolderPath}"`)
  return cacheFolderPath
}
