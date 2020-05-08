import { addPath } from '@actions/core'
import { Inputs } from '../inputs'

export function setOutputs(inputs: Inputs) {
  addPath(inputs.binDest)
}

export default setOutputs
