import { setFailed, startGroup, endGroup } from '@actions/core'
import { Inputs } from '../inputs'
import runSelfInstaller from './run'

export { runSelfInstaller }

export async function install(inputs: Inputs) {
  startGroup('Running self-installer...')
  const status = await runSelfInstaller(inputs)
  endGroup()
  if (status) {
    return setFailed(`Something went wrong, self-installer exits with code ${status}`)
  }
}

export default install
