import { inspect } from 'util'
import { setFailed, warning } from '@actions/core'
import getInputs from './inputs'
import setOutputs from './outputs'
import install from './install'

warning(`EXEC_PATH ${process.execPath}`)
warning(`EXEC_ARGV ${inspect(process.execArgv)}`)

const inputs = getInputs()

install(inputs).then(() => {
  console.log('Installation Completed!')
  setOutputs(inputs)
}).catch(error => {
  console.error(error)
  setFailed(error)
})
