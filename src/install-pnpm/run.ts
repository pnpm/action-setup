import { addPath, exportVariable } from '@actions/core'
import { spawn } from 'child_process'
import { rm, writeFile, mkdir, symlink } from 'fs/promises'
import { readFileSync, existsSync } from 'fs'
import path from 'path'
import util from 'util'
import { Inputs } from '../inputs'
import { parse as parseYaml } from 'yaml'
import pnpmLock from './bootstrap/pnpm-lock.json'
import exeLock from './bootstrap/exe-lock.json'

const BOOTSTRAP_PNPM_PACKAGE_JSON = JSON.stringify({ private: true, dependencies: { pnpm: pnpmLock.packages['node_modules/pnpm'].version } })
const BOOTSTRAP_EXE_PACKAGE_JSON = JSON.stringify({ private: true, dependencies: { '@pnpm/exe': exeLock.packages['node_modules/@pnpm/exe'].version } })

export async function runSelfInstaller(inputs: Inputs): Promise<number> {
  const { version, dest, packageJsonFile, standalone } = inputs

  // Install bootstrap pnpm via npm (integrity verified by committed lockfile)
  await rm(dest, { recursive: true, force: true })
  await mkdir(dest, { recursive: true })

  const lockfile = standalone ? exeLock : pnpmLock
  const packageJson = standalone ? BOOTSTRAP_EXE_PACKAGE_JSON : BOOTSTRAP_PNPM_PACKAGE_JSON
  await writeFile(path.join(dest, 'package.json'), packageJson)
  await writeFile(path.join(dest, 'package-lock.json'), JSON.stringify(lockfile))

  const npmExitCode = await runCommand('npm', ['ci'], { cwd: dest })
  if (npmExitCode !== 0) {
    return npmExitCode
  }

  const pnpmHome = path.join(dest, 'node_modules', '.bin')
  addPath(pnpmHome)
  addPath(path.join(pnpmHome, 'bin'))
  exportVariable('PNPM_HOME', pnpmHome)

  // Ensure pnpm bin link exists — npm ci sometimes doesn't create it
  const pnpmBinLink = path.join(pnpmHome, 'pnpm')
  if (!existsSync(pnpmBinLink)) {
    await mkdir(pnpmHome, { recursive: true })
    const target = standalone
      ? path.join('..', '@pnpm', 'exe', 'pnpm')
      : path.join('..', 'pnpm', 'bin', 'pnpm.cjs')
    await symlink(target, pnpmBinLink)
  }

  const bootstrapPnpm = standalone
    ? path.join(dest, 'node_modules', '@pnpm', 'exe', 'pnpm')
    : path.join(dest, 'node_modules', 'pnpm', 'bin', 'pnpm.cjs')

  // Determine the target version
  const targetVersion = readTargetVersion({ version, packageJsonFile })

  if (targetVersion) {
    const cmd = standalone ? bootstrapPnpm : process.execPath
    const args = standalone ? ['self-update', targetVersion] : [bootstrapPnpm, 'self-update', targetVersion]
    const exitCode = await runCommand(cmd, args, { cwd: dest })
    if (exitCode !== 0) {
      return exitCode
    }
  }

  return 0
}

function readTargetVersion(opts: {
  readonly version?: string | undefined
  readonly packageJsonFile: string
}): string | undefined {
  const { version, packageJsonFile } = opts
  const { GITHUB_WORKSPACE } = process.env

  let packageManager: unknown

  if (GITHUB_WORKSPACE) {
    try {
      const content = readFileSync(path.join(GITHUB_WORKSPACE, packageJsonFile), 'utf8');
      ({ packageManager } = packageJsonFile.endsWith(".yaml")
        ? parseYaml(content, { merge: true })
        : JSON.parse(content)
      )
    } catch (error: unknown) {
      // Swallow error if package.json doesn't exist in root
      if (!util.types.isNativeError(error) || !('code' in error) || error.code !== 'ENOENT') throw error
    }
  }

  if (version) {
    if (
      typeof packageManager === 'string' &&
      packageManager.startsWith('pnpm@') &&
      packageManager.replace('pnpm@', '') !== version
    ) {
      throw new Error(`Multiple versions of pnpm specified:
  - version ${version} in the GitHub Action config with the key "version"
  - version ${packageManager} in the package.json with the key "packageManager"
Remove one of these versions to avoid version mismatch errors like ERR_PNPM_BAD_PM_VERSION`)
    }

    return version
  }

  if (typeof packageManager === 'string' && packageManager.startsWith('pnpm@')) {
    // Strip the "pnpm@" prefix and any "+sha..." hash suffix
    return packageManager.replace('pnpm@', '').replace(/\+.*$/, '')
  }

  if (!GITHUB_WORKSPACE) {
    throw new Error(`No workspace is found.
If you've intended to let pnpm/action-setup read preferred pnpm version from the "packageManager" field in the package.json file,
please run the actions/checkout before pnpm/action-setup.
Otherwise, please specify the pnpm version in the action configuration.`)
  }

  throw new Error(`No pnpm version is specified.
Please specify it by one of the following ways:
  - in the GitHub Action config with the key "version"
  - in the package.json with the key "packageManager"`)
}

function runCommand(cmd: string, args: string[], opts: { cwd: string }): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    const cp = spawn(cmd, args, {
      cwd: opts.cwd,
      stdio: ['pipe', 'inherit', 'inherit'],
      shell: process.platform === 'win32',
    })
    cp.on('error', reject)
    cp.on('close', resolve)
  })
}

export default runSelfInstaller
