import { addPath, exportVariable } from '@actions/core'
import fetch from '@pnpm/fetch'
import { spawn } from 'child_process'
import { remove, ensureFile, writeFile, readFile } from 'fs-extra'
import { join } from 'path'
import { execPath } from 'process'
import { Inputs } from '../inputs'

export async function runSelfInstaller(inputs: Inputs): Promise<number> {
  const { version, dest } = inputs

  // prepare self install
  await remove(dest)
  const pkgJson = join(dest, 'package.json')
  await ensureFile(pkgJson)
  await writeFile(pkgJson, JSON.stringify({ private: true }))

  // prepare target pnpm
  const target = await readTarget(version)
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
    const pnpmHome = join(dest, 'node_modules/.bin')
    addPath(pnpmHome)
    exportVariable('PNPM_HOME', pnpmHome)
  }
  return exitCode
}

async function readTarget(version?: string | undefined) {
  if (version) return `pnpm@${version}`

  const workspace = process.env.GITHUB_WORKSPACE
  if (!workspace) {
    throw new Error(`No workspace is found.
If you're intended to let this action read pnpm version from the package.json/packageManager field,
please run the actions/checkout before this one, otherwise please specify the version in the action config.`)
  }

  const { packageManager } = JSON.parse(await readFile(join(workspace, 'package.json'), 'utf8'))
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
