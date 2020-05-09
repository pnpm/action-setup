import process from 'process'
import path from 'path'
import { Inputs } from '../inputs'

export const patchPnpmEnv = (inputs: Inputs): NodeJS.ProcessEnv => ({
  ...process.env,
  PATH: inputs.binDest + path.delimiter + process.env.PATH
})
