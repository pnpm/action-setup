import { getInput,InputOptions } from '@actions/core'
import { parse } from 'yaml'

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
  const input: any = parse(getInput(name, options))

  if (!input) return []
  if (input === true) return [{ recursive: true }]

  validateRunInstallInput(input)

  if (Array.isArray(input)) return input

  return input;
}

function validateRunInstallInput(input: any) {
  if (Array.isArray(input)) {
    for (const entry of input) {
      validateRunInstallEntry(entry)
    }
  } else {
    validateRunInstallEntry(input)
  }

}

function validateRunInstallEntry(input: any) {
  if (typeof input !== 'object') {
    throw new Error('Invalid input for run_install')
  }

  if (input.recursive !== undefined && typeof input.recursive !== 'boolean') {
    throw new Error('Invalid input for run_install.recursive')
  }

  if (input.cwd !== undefined && typeof input.cwd !== 'string') {
    throw new Error('Invalid input for run_install.cwd')
  }

  if (input.args !== undefined && !Array.isArray(input.args)) {
    throw new Error('Invalid input for run_install.args')
  }
}