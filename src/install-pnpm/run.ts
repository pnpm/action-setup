import { addPath, exportVariable } from '@actions/core'
import { spawn } from 'child_process'
import { rm, writeFile, mkdir } from 'fs/promises'
import { readFileSync } from 'fs'
import path from 'path'
import { execPath } from 'process'
import util from 'util'
import { Inputs } from '../inputs'

export async function runSelfInstaller(inputs: Inputs): Promise<number> {
  const { version, dest, packageJsonFile, standalone } = inputs

  // prepare self install
  await rm(dest, { recursive: true, force: true })
  // create dest directory after removal
  await mkdir(dest, { recursive: true })
  const pkgJson = path.join(dest, 'package.json')
  // we have ensured the dest directory exists, we can write the file directly
  await writeFile(pkgJson, JSON.stringify({ private: true }))

  // prepare target pnpm
  const target = await readTarget({ version, packageJsonFile, standalone })
  const cp = spawn(execPath, [path.join(__dirname, 'pnpm.cjs'), 'install', target, '--no-lockfile'], {
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
  readonly standalone: boolean
}) {
  const { version, packageJsonFile, standalone } = opts
  const { GITHUB_WORKSPACE } = process.env

  let packageManager

  if (GITHUB_WORKSPACE) {
    try {
      ({ packageManager } = JSON.parse(readFileSync(path.join(GITHUB_WORKSPACE, packageJsonFile), 'utf8')))
    } catch (error: unknown) {
      // Swallow error if package.json doesn't exist in root
      if (!util.types.isNativeError(error) || !('code' in error) || error.code !== 'ENOENT') throw error
    }
  }

  if (version) {
    if (
      typeof packageManager === 'string' &&
      packageManager.replace('pnpm@', '') !== version
    ) {
      throw new Error(`Multiple versions of pnpm specified:
  - version ${version} in the GitHub Action config with the key "version"
  - version ${packageManager} in the package.json with the key "packageManager"
Remove one of these versions to avoid version mismatch errors like ERR_PNPM_BAD_PM_VERSION`)
    }
    
    return `${ standalone ? '@pnpm/exe' : 'pnpm' }@${version}`
  }

  if (!GITHUB_WORKSPACE) {
    throw new Error(`No workspace is found.
If you're intended to let pnpm/action-setup read preferred pnpm version from the "packageManager" field in the package.json file,
please run the actions/checkout before pnpm/action-setup.
Otherwise, please specify the pnpm version in the action configuration.`)
  }

  if (typeof packageManager !== 'string') {
    throw new Error(`No pnpm version is specified.
Please specify it by one of the following ways:
  - in the GitHub Action config with the key "version"
  - in the package.json with the key "packageManager"`)
  }

  if (!packageManager.startsWith('pnpm@')) {
    throw new Error('Invalid packageManager field in package.json')
  }

  if (standalone) {
    return packageManager.replace('pnpm@', '@pnpm/exe@')
  }

  return packageManager
}

export default runSelfInstaller
