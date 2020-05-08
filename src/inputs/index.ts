import { getInput, InputOptions } from '@actions/core'

export interface Inputs {
  readonly version: string
  readonly dest: string
  readonly binDest: string
  readonly registry: string
}

const options: InputOptions = {
  required: true,
}

export const getInputs = (): Inputs => ({
  version: getInput('version', options),
  dest: getInput('dest', options),
  binDest: getInput('bin_dest', options),
  registry: getInput('registry', options),
})

export default getInputs
