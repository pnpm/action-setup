import { addPath, exportVariable } from '@actions/core'
import fetch from '@pnpm/fetch'
import { spawn } from 'child_process'
import { remove, ensureFile, writeFile, readFile } from 'fs-extra'
import path from 'path'
import { execPath } from 'process'
import { Inputs } from '../inputs'

export async function runSelfInstaller(inputs: Inputs): Promise<number> {
  const { version, dest } = inputs
  const pkgJson = path.join(dest, 'package.json')
  const target = await readTarget(pkgJson, version)

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

async function readTarget(packageJsonPath: string, version?: string | undefined) {
  if (version) return `pnpm@${version}`

  const { packageManager } = JSON.parse(await readFile(packageJsonPath, 'utf8'))
  if (typeof packageManager !== 'string') {
    throw new Error(`No pnpm version is specified.
Please specify it by one of the following ways:
  - in the GitHub Action config with the key "version"
  - in the package.json with the key "packageManager" (See https://nodejs.org/api/corepack.html)`)
  }

  if (!packageManager.startsWith('pnpm@')) {
    throw new Error('Invalid packageManager field in package.json')
  }
  return packageManager
}

export default runSelfInstaller
