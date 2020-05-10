import process from 'process'
import { safeLoad } from 'js-yaml'
import Ajv from 'ajv'
import { getInput, error, InputOptions } from '@actions/core'
import runInstallSchema from './run-install-input.schema.json'

export interface RunInstall {
  readonly recursive?: boolean
  readonly cwd?: string
  readonly args?: readonly string[]
}

export type RunInstallInput =
  | null
  | boolean
  | RunInstall
  | RunInstall[]

const options: InputOptions = {
  required: true,
}

export function parseRunInstall(name: string): RunInstall[] {
  const result: RunInstallInput = safeLoad(getInput(name, options))
  const ajv = new Ajv({
    allErrors: true,
    async: false,
  })
  const validate = ajv.compile(runInstallSchema)
  if (!validate(result)) {
    for (const errorItem of validate.errors!) {
      error(`with.run_install${errorItem.dataPath}: ${errorItem.message}`)
    }
    return process.exit(1)
  }
  if (!result) return []
  if (result === true) return [{ recursive: true }]
  if (Array.isArray(result)) return result
  return [result]
}
