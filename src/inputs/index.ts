import { getBooleanInput, getInput, InputOptions } from '@actions/core'
import expandTilde from 'expand-tilde'
import { RunInstall, parseRunInstall } from './run-install'

export interface Inputs {
  readonly version?: string
  readonly dest: string
  readonly cache: boolean
  readonly cacheDependencyPath: string
  readonly runInstall: RunInstall[]
  readonly packageJsonFile: string
  readonly standalone: boolean
}

const options: InputOptions = {
  required: true,
}

const parseInputPath = (name: string) => expandTilde(getInput(name, options))

export const getInputs = (): Inputs => ({
  version: getInput('version'),
  dest: parseInputPath('dest'),
  cache: getBooleanInput('cache'),
  cacheDependencyPath: parseInputPath('cache_dependency_path'),
  runInstall: parseRunInstall('run_install'),
  packageJsonFile: parseInputPath('package_json_file'),
  standalone: getBooleanInput('standalone'),
})

export default getInputs
