import { setOutput, addPath } from '@actions/core'
import { Inputs } from '../inputs'

export function setOutputs(inputs: Inputs) {
  addPath(inputs.binDest)
  setOutput('dest', inputs.dest)
  setOutput('bin_dest', inputs.binDest)
}

export default setOutputs
