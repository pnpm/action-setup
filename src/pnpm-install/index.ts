import { spawnSync } from 'child_process'
import { setFailed } from '@actions/core'
import { Inputs } from '../inputs'
import { patchPnpmEnv } from '../utils'

export function runPnpmInstall(inputs: Inputs) {
  const env = patchPnpmEnv(inputs)

  for (const options of inputs.runInstall) {
    const args = ['install']
    if (options.recursive) args.unshift('recursive')
    if (options.args) args.push(...options.args)

    const cmdStr = ['pnpm', ...args].join(' ')
    console.log('Running', cmdStr)

    const { error, status } = spawnSync('pnpm', args, {
      stdio: 'inherit',
      cwd: options.cwd,
      shell: true,
      env,
    })

    if (error) {
      setFailed(error)
      continue
    }

    if (status) {
      setFailed(`Command ${cmdStr} (cwd: ${options.cwd}) exits with status ${status}`)
      continue
    }
  }
}

export default runPnpmInstall
