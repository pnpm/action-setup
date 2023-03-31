import { getBooleanInput, getInput, InputOptions } from '@actions/core'
import expandTilde from 'expand-tilde'
import { RunInstall, parseRunInstall } from './run-install'

export interface Inputs {
  readonly version?: string
  readonly dest: string
  readonly runInstall: RunInstall[]
  readonly nodeJsBundled: boolean
}

const options: InputOptions = {
  required: true,
}

const parseInputPath = (name: string) => expandTilde(getInput(name, options))

export const getInputs = (): Inputs => ({
  version: getInput('version'),
  dest: parseInputPath('dest'),
  runInstall: parseRunInstall('run_install'),
  nodeJsBundled: getBooleanInput('nodejs_bundled'),
})

export default getInputs
