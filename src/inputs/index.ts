import process from 'process'
import { getInput, error, InputOptions } from '@actions/core'
import expandTilde from 'expand-tilde'
import { safeLoad } from 'js-yaml'
import Ajv from 'ajv'
import runInstallSchema from './run-install-input.schema.json'

interface RunInstall {
  readonly recursive?: boolean
  readonly cwd?: string
  readonly args?: readonly string[]
}

export type RunInstallInput =
  | null
  | boolean
  | RunInstall
  | RunInstall[]

export interface Inputs {
  readonly version: string
  readonly dest: string
  readonly binDest: string
  readonly registry: string
  readonly runInstall: RunInstall[]
}

const options: InputOptions = {
  required: true,
}

const parseInputPath = (name: string) => expandTilde(getInput(name, options))

function parseRunInstall(name: string): RunInstall[] {
  const result: RunInstallInput = safeLoad(getInput(name, options))
  const ajv = new Ajv({
    allErrors: true,
    async: false,
  })
  const validate = ajv.compile(runInstallSchema)
  if (!validate(result)) {
    for (const errorItem of validate.errors!) {
      error(`${errorItem.dataPath}: ${errorItem.message}`)
    }
    return process.exit(1)
  }
  if (!result) return []
  if (result === true) return [{ recursive: true }]
  if (Array.isArray(result)) return result
  return [result]
}

export const getInputs = (): Inputs => ({
  version: getInput('version', options),
  dest: parseInputPath('dest'),
  binDest: parseInputPath('bin_dest'),
  registry: getInput('registry', options),
  runInstall: parseRunInstall('run_install'),
})

export default getInputs
