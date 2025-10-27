import { setFailed } from '@actions/core'
import getInputs from './inputs'
import installPnpm from './install-pnpm'
import setOutputs from './outputs'
import pnpmInstall from './pnpm-install'
import pruneStore from './pnpm-store-prune'

async function main() {
  const inputs = getInputs()
  await installPnpm(inputs)
  console.log('Installation Completed!')
  setOutputs(inputs)
  pnpmInstall(inputs)
  pruneStore(inputs)
}

main().catch(error => {
  console.error(error)
  setFailed(error)
})
