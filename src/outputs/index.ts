import { setOutput } from '@actions/core'
import { Inputs } from '../inputs'
import { getBinDest } from '../utils'

export function setOutputs(inputs: Inputs) {
  const binDest = getBinDest(inputs)
  // NOTE: addPath is already called in installPnpm — do not call it again
  // here, as a second addPath would shadow the correct entry on Windows.
  setOutput('dest', inputs.dest)
  setOutput('bin_dest', binDest)
}

export default setOutputs
