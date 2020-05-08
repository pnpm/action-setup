import { setFailed } from '@actions/core'
import getInputs from './inputs'
import setOutputs from './outputs'
import install from './install'

async function main() {
  const inputs = getInputs()
  await install(inputs)
  console.log('Installation Completed!')
  setOutputs(inputs)
}

main().catch(error => {
  console.error(error)
  setFailed(error)
})
