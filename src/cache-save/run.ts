import { saveCache } from '@actions/cache'
import { getState, info } from '@actions/core'
import { access } from 'fs/promises'

export async function runSaveCache() {
  const state = getState('cache_restored_key')
  const primaryKey = getState('cache_primary_key')
  const cachePath = getState('cache_path')

  if (primaryKey === state) {
    info(`Cache hit occurred on the primary key ${primaryKey}, not saving cache.`)
    return
  }

  try {
    await access(cachePath)
  } catch {
    info(`Cache path ${cachePath} does not exist, not saving cache.`)
    return
  }

  const cacheId = await saveCache([cachePath], primaryKey)
  if (cacheId == -1) return

  info(`Cache saved with the key: ${primaryKey}`)
}
