import { addPath, exportVariable } from '@actions/core'
import { spawn } from 'child_process'
import { remove, ensureFile, writeFile, readFile } from 'fs-extra'
import path from 'path'
import { execPath } from 'process'
import { Inputs } from '../inputs'

export async function runSelfInstaller(inputs: Inputs): Promise<number> {
  const { version, dest, packageJsonFile, nodeJsBundled } = inputs

  // prepare self install
  await remove(dest)
  const pkgJson = path.join(dest, 'package.json')
  await ensureFile(pkgJson)
  await writeFile(pkgJson, JSON.stringify({ private: true }))

  // prepare target pnpm
  const target = await readTarget({ version, packageJsonFile, nodeJsBundled })
  const cp = spawn(execPath, [path.join(__dirname, 'pnpm.js'), 'install', target, '--no-lockfile'], {
    cwd: dest,
    stdio: ['pipe', 'inherit', 'inherit'],
  })

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

async function readTarget(opts: {
  readonly version?: string | undefined
  readonly packageJsonFile: string
  readonly nodeJsBundled: boolean
}) {
  const { version, packageJsonFile, nodeJsBundled } = opts

  if (version) return `${ nodeJsBundled ? '@pnpm/exe' : 'pnpm' }@${version}`

  const { GITHUB_WORKSPACE } = process.env
  if (!GITHUB_WORKSPACE) {
    throw new Error(`No workspace is found.
If you're intended to let pnpm/action-setup read preferred pnpm version from the "packageManager" field in the package.json file,
please run the actions/checkout before pnpm/action-setup.
Otherwise, please specify the pnpm version in the action configuration.`)
  }

  const { packageManager } = JSON.parse(await readFile(path.join(GITHUB_WORKSPACE, packageJsonFile), 'utf8'))
  if (typeof packageManager !== 'string') {
    throw new Error(`No pnpm version is specified.
Please specify it by one of the following ways:
  - in the GitHub Action config with the key "version"
  - in the package.json with the key "packageManager"`)
  }

  if (!packageManager.startsWith('pnpm@')) {
    throw new Error('Invalid packageManager field in package.json')
  }

  if(nodeJsBundled){
    return packageManager.replace('pnpm@', '@pnpm/exe@')
  }

  return packageManager
}

export default runSelfInstaller
