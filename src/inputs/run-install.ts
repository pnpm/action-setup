import { getInput, InputOptions, error } from '@actions/core'
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

  if (!isInputValid(input)) process.exit(1);

  return Array.isArray(input) ? input : [input]
}

function isInputValid(input: any) {
  if (Array.isArray(input)) {
    return input.every(isEntryValid)
  } else {
    return isEntryValid(input)
  }
}

function isEntryValid(input: any): boolean {
  if (typeof input !== 'object') {
    error(`Invalid input for run_install. Expected object, but got ${typeof input}`)
    return false;
  }

  if (input.recursive !== undefined && typeof input.recursive !== 'boolean') {
    error(`Invalid input for run_install.recursive. Expected boolean, but got ${typeof input.recursive}`)
    return false;
  }

  if (input.cwd !== undefined && typeof input.cwd !== 'string') {
    error(`Invalid input for run_install.cwd. Expected string, but got ${typeof input.cwd}`)
    return false;
  }

  if (input.args !== undefined && !Array.isArray(input.args)) {
    error(`Invalid input for run_install.args. Expected array, but got ${typeof input.args}`)
    return false;
  }

  const invalidArgs: any[] = input.args.filter((arg: any) => typeof arg !== 'string');
  if (input.args !== undefined && invalidArgs.length > 0) {
    const invalidArgsMessage = invalidArgs.map((arg: any) => typeof arg).join(', ');
    error(`Invalid input for run_install.args. Expected array of strings, but got ${invalidArgsMessage}`)
    return false;
  }

  return true;
}
