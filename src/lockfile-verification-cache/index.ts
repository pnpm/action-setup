import { restoreCache, saveCache } from '@actions/cache'
import { debug, getState, info, saveState, warning } from '@actions/core'
import { getExecOutput } from '@actions/exec'
import { existsSync } from 'fs'
import os from 'os'
import path from 'path'
import { removeWindowsExtendedPathPrefix } from '../windows-path'

/**
 * Where pnpm v11+ memoizes which lockfile passed which supply-chain policies.
 * A job without it re-checks every lockfile entry against the registry, which
 * on a large repository costs more than the install.
 */
const VERIFICATION_CACHE_FILE = 'lockfile-verified.jsonl'

const PATH_STATE = 'lockfile_verification_cache_path'
const KEY_STATE = 'lockfile_verification_cache_key'
const RESTORED_STATE = 'lockfile_verification_cache_restored'

/**
 * The verdict is only valid for the exact lockfile content it was recorded
 * for, so this cache is keyed on the same lockfile hash as the store cache
 * but restored without prefix fallback: an older entry could never be used.
 */
export async function restoreVerificationCache(lockfileHash: string): Promise<void> {
  try {
    const cacheFilePath = path.join(await getPnpmCacheDirectory(), VERIFICATION_CACHE_FILE)
    const key = `pnpm-lockfile-verified-${process.env.RUNNER_OS}-${os.arch()}-${lockfileHash}`
    saveState(PATH_STATE, cacheFilePath)
    saveState(KEY_STATE, key)
    debug(`Lockfile verification cache path is ${cacheFilePath}, key is ${key}`)

    const restoredKey = await restoreCache([cacheFilePath], key)
    if (!restoredKey) {
      info('Lockfile verification cache is not found')
      return
    }

    saveState(RESTORED_STATE, 'true')
    info(`Lockfile verification cache restored from key: ${restoredKey}`)
  } catch (error) {
    // The gate only costs time, never correctness — a job that cannot reuse
    // a past verdict re-verifies and moves on.
    warning(`Failed to restore the lockfile verification cache: ${(error as Error).message}`)
  }
}

export async function saveVerificationCache(): Promise<void> {
  if (getState(RESTORED_STATE) === 'true') return

  const cacheFilePath = getState(PATH_STATE)
  const key = getState(KEY_STATE)
  if (!cacheFilePath || !key || !existsSync(cacheFilePath)) return

  try {
    const cacheId = await saveCache([cacheFilePath], key)
    if (cacheId === -1) return
    info(`Lockfile verification cache saved with the key: ${key}`)
  } catch (error) {
    warning(`Failed to save the lockfile verification cache: ${(error as Error).message}`)
  }
}

async function getPnpmCacheDirectory(): Promise<string> {
  const { stdout } = await getExecOutput('pnpm config get cacheDir', undefined, {
    silent: true,
    ignoreReturnCode: true,
  })
  const configured = stdout.trim()
  // `pnpm config get` reports settings, not defaults: an unset `cacheDir`
  // prints `undefined` and the default has to be derived here.
  if (configured && configured !== 'undefined') {
    return removeWindowsExtendedPathPrefix(configured)
  }
  return defaultPnpmCacheDirectory()
}

/** Mirrors pnpm's own `cacheDir` default. */
function defaultPnpmCacheDirectory(): string {
  const { XDG_CACHE_HOME, LOCALAPPDATA } = process.env
  if (XDG_CACHE_HOME) return path.join(XDG_CACHE_HOME, 'pnpm')

  const homeDir = os.homedir()
  switch (process.platform) {
  case 'darwin':
    return path.join(homeDir, 'Library', 'Caches', 'pnpm')
  case 'win32':
    return LOCALAPPDATA ? path.join(LOCALAPPDATA, 'pnpm-cache') : path.join(homeDir, '.pnpm-cache')
  default:
    return path.join(homeDir, '.cache', 'pnpm')
  }
}
