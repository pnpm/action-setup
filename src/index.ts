import { setFailed, saveState, getState } from '@actions/core'
import getInputs from './inputs'
import setOutputs from './outputs'
import installPnpm from './install-pnpm'
import pnpmInstall from './pnpm-install'

async function main() {
  const isPost = getState('is_post')
  if (isPost === 'true') return
  saveState('is_post', 'true')
  const inputs = getInputs()
  await installPnpm(inputs)
  console.log('Installation Completed!')
  setOutputs(inputs)
  pnpmInstall(inputs)
}

main().catch(error => {
  console.error(error)
  setFailed(error)
})
