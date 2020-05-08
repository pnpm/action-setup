import { inspect } from 'util'
import { getInput, error, InputOptions } from '@actions/core'
import * as glob from '@actions/glob'

export interface Inputs {
  readonly version: string
  readonly dest: string
  readonly binDest: string
  readonly registry: string
}

const options: InputOptions = {
  required: true,
}

async function parsePath(pattern: string, inputName: string) {
  const builder = await glob.create(pattern)
  const paths = await builder.glob()
  if (paths.length !== 1) {
    error(`Input ${inputName} is expected to match 1 path, but it matches ${paths.length}: ${inspect(paths)}`)
    throw process.exit(1)
  }
  return paths[0]
}

const parseInputPath = (name: string) => parsePath(getInput(name, options), name)

export const getInputs = async (): Promise<Inputs> => ({
  version: getInput('version', options),
  dest: await parseInputPath('dest'),
  binDest: await parseInputPath('bin_dest'),
  registry: getInput('registry', options),
})

export default getInputs
