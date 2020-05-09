import { setFailed, saveState, getState } from '@actions/core'
import getInputs from './inputs'
import setOutputs from './outputs'
import installPnpm from './install-pnpm'
import pnpmInstall from './pnpm-install'
import pruneStore from './pnpm-store-prune'

async function main() {
  const inputs = getInputs()
  const isPost = getState('is_post')
  if (isPost === 'true') return pruneStore(inputs)
  saveState('is_post', 'true')
  await installPnpm(inputs)
  console.log('Installation Completed!')
  setOutputs(inputs)
  pnpmInstall(inputs)
}

main().catch(error => {
  console.error(error)
  setFailed(error)
})
