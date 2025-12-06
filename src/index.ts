import { setFailed, saveState, getState } from '@actions/core'
import restoreCache from './cache-restore'
import saveCache from './cache-save'
import getInputs, { Inputs } from './inputs'
import installPnpm from './install-pnpm'
import setOutputs from './outputs'
import pnpmInstall from './pnpm-install'
import pruneStore from './pnpm-store-prune'

async function main() {
  const inputs = getInputs()

  if (getState('is_post') === 'true') {
    await runPost(inputs)
  } else {
    await runMain(inputs)
  }
}

async function runMain(inputs: Inputs) {
  saveState('is_post', 'true')

  await installPnpm(inputs)
  console.log('Installation Completed!')
  setOutputs(inputs)

  await restoreCache(inputs)

  pnpmInstall(inputs)
}

async function runPost(inputs: Inputs) {
  pruneStore(inputs)
  await saveCache(inputs)
}

main().catch(error => {
  console.error(error)
  setFailed(error)
})
