import process from 'process'
import path from 'path'
import { Inputs } from '../inputs'

export const getBinDest = (inputs: Inputs): string => path.join(inputs.dest, 'node_modules', '.bin')

export const patchPnpmEnv = (inputs: Inputs): NodeJS.ProcessEnv => ({
  ...process.env,
  PATH: getBinDest(inputs) + path.delimiter + process.env.PATH
})
