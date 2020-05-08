import { setFailed } from '@actions/core'
import getInputs from './inputs'
import install from './install'

const inputs = getInputs()

install(inputs).then(() => {
  console.log('Installation Completed!')
}).catch(error => {
  console.error(error)
  setFailed(error)
})
