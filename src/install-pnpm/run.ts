import { addPath, exportVariable } from '@actions/core'
import { spawn } from 'child_process'
import { execPath } from 'process'
import path from 'path'
import { remove, ensureFile, writeFile, readFile } from 'fs-extra'
import fetch from '@pnpm/fetch'
import { Inputs } from '../inputs'

export async function runSelfInstaller(inputs: Inputs): Promise<number> {
  const { version, dest } = inputs
  const pkgJson = path.join(dest, 'package.json')
  let target: string

  if (!version) {
    const packageManager = JSON.parse(await readFile(pkgJson, 'utf8')).packageManager
    if (packageManager) {
      if (!packageManager.startsWith('pnpm@')) {
        throw new Error('packageManager field is not pnpm')
      }
      target = packageManager
    } else {
      throw new Error('None of packageManager (in package.json) or version (in action config) is defined')
    }
  } else {
    target = `pnpm@${version}`
  }

  await remove(dest)
  await ensureFile(pkgJson)
  await writeFile(pkgJson, JSON.stringify({ private: true }))

  const cp = spawn(execPath, ['-', 'install', target, '--no-lockfile'], {
    cwd: dest,
    stdio: ['pipe', 'inherit', 'inherit'],
  })

  const response = await fetch('https://get.pnpm.io/v6.16.js')
  if (!response.body) throw new Error('Did not receive response body')
  response.body.pipe(cp.stdin)

  const exitCode = await new Promise<number>((resolve, reject) => {
    cp.on('error', reject)
    cp.on('close', resolve)
  })
  if (exitCode === 0) {
    const pnpmHome = path.join(dest, 'node_modules/.bin')
    addPath(pnpmHome)
    exportVariable('PNPM_HOME', pnpmHome)
  }
  return exitCode
}

export default runSelfInstaller
