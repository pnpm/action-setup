import { isFeatureAvailable } from '@actions/cache'
import { endGroup, startGroup, warning } from '@actions/core'
import { Inputs } from '../inputs'
import { runRestoreCache } from './run'

export async function restoreCache(inputs: Inputs) {
  if (!inputs.cache) return

  if (!isFeatureAvailable()) {
    warning('Cache is not available, skipping cache restoration')
    return
  }

  startGroup('Restoring cache...')
  await runRestoreCache(inputs)
  endGroup()
}

export default restoreCache
