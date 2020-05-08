import { setFailed } from '@actions/core'
import { Inputs } from '../inputs'
import runSelfInstaller from './run'

export { runSelfInstaller }

export async function install(inputs: Inputs) {
  const status = await runSelfInstaller(inputs)
  if (status) {
    return setFailed(`Something does wrong, self-installer exits with code ${status}`)
  }
}

export default install
