import { addPath, exportVariable } from '@actions/core'
import { spawn } from 'child_process'
import { execPath } from 'process'
import path from 'path'
import { remove, ensureFile, writeFile } from 'fs-extra'
import fetch from 'node-fetch'
import { Inputs } from '../inputs'

export async function runSelfInstaller(inputs: Inputs): Promise<number> {
  const { version, dest } = inputs
  const target = version ? `pnpm@${version}` : 'pnpm'
  const pkgJson = path.join(dest, 'package.json')

  await remove(dest)
  await ensureFile(pkgJson)
  await writeFile(pkgJson, JSON.stringify({ private: true }))

  const cp = spawn(execPath, ['-', 'install', target, '--no-lockfile'], {
    cwd: dest,
    stdio: ['pipe', 'inherit', 'inherit'],
  })

  const response = await fetch('https://pnpm.io/pnpm.js')
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
