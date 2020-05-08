import { setFailed } from '@actions/core'
import { getInputs } from '../inputs'
import runSelfInstaller from './run'

export { runSelfInstaller }

export async function install() {
  const { error, status } = await runSelfInstaller(getInputs())

  if (error) return setFailed(error)

  if (status) {
    return setFailed(`Something does wrong, self-installer exits with code ${status}`)
  }
}

export default install
