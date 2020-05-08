import { setFailed } from '@actions/core'
import getInputs from './inputs'
import setOutputs from './outputs'
import install from './install'

const inputs = getInputs()

install(inputs).then(() => {
  console.log('Installation Completed!')
  setOutputs(inputs)
}).catch(error => {
  console.error(error)
  setFailed(error)
})
