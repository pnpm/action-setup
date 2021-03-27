import { setOutput, addPath } from '@actions/core'
import { Inputs } from '../inputs'
import { getBinDest } from '../utils'

export function setOutputs(inputs: Inputs) {
  const binDest = getBinDest(inputs)
  addPath(binDest)
  setOutput('dest', inputs.dest)
  setOutput('bin_dest', binDest)
}

export default setOutputs
