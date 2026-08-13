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
const STORED_STATE = 'lockfile_verification_cache_stored'

/**
 * Where the log lives and under which key it belongs in the cache. Held in
 * memory as well as in the action's state because the main and post steps run
 * as separate processes, and state written by one is only readable by the
 * other.
 */
let target: { cacheFilePath: string, key: string } | undefined

/** Whether this process already restored or saved the log. */
let stored = false

/**
 * The verdict is only valid for the exact lockfile content it was recorded
 * for, so this cache is keyed on the same lockfile hash as the store cache
 * but restored without prefix fallback: an older entry could never be used.
 */
export async function restoreVerificationCache(lockfileHash: string): Promise<void> {
  try {
    const cacheFilePath = path.join(await getPnpmCacheDirectory(), VERIFICATION_CACHE_FILE)
    const key = `pnpm-lockfile-verified-${process.env.RUNNER_OS}-${os.arch()}-${lockfileHash}`
    target = { cacheFilePath, key }
    saveState(PATH_STATE, cacheFilePath)
    saveState(KEY_STATE, key)
    debug(`Lockfile verification cache path is ${cacheFilePath}, key is ${key}`)

    const restoredKey = await restoreCache([cacheFilePath], key)
    if (!restoredKey) {
      info('Lockfile verification cache is not found')
      return
    }

    stored = true
    saveState(STORED_STATE, 'true')
    info(`Lockfile verification cache restored from key: ${restoredKey}`)
  } catch (error) {
    // The gate only costs time, never correctness — a job that cannot reuse
    // a past verdict re-verifies and moves on.
    warning(`Failed to restore the lockfile verification cache: ${(error as Error).message}`)
  }
}

/**
 * Uploaded as soon as the install that produced the log finishes, rather than
 * at the end of the job: whatever a job runs after installing can rewrite the
 * log on disk, and the job's own cache write would then publish that for later
 * jobs to trust. Lifecycle scripts of the installed packages stay inside the
 * window — they run during the install — but pnpm only runs those the
 * repository has allow-listed.
 *
 * Safe to call more than once; the second call is a no-op.
 */
export async function saveVerificationCache(): Promise<void> {
  if (stored || getState(STORED_STATE) === 'true') return

  const cacheFilePath = target?.cacheFilePath ?? getState(PATH_STATE)
  const key = target?.key ?? getState(KEY_STATE)
  if (!cacheFilePath || !key || !existsSync(cacheFilePath)) return

  try {
    const cacheId = await saveCache([cacheFilePath], key)
    if (cacheId === -1) return
    stored = true
    saveState(STORED_STATE, 'true')
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
