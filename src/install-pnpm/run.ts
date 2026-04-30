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
  const { version, dest, packageJsonFile } = inputs

  // pnpm v11 requires Node >= 22.13; use standalone (exe) bootstrap which
  // bundles its own Node.js when the system Node is too old
  const systemNode = await getSystemNodeVersion()
  const standalone = inputs.standalone || systemNode.major < 22 || (systemNode.major === 22 && systemNode.minor < 13)

  // Install bootstrap pnpm via npm (integrity verified by committed lockfile)
  await rm(dest, { recursive: true, force: true })
  await mkdir(dest, { recursive: true })

  const lockfile = standalone ? exeLock : pnpmLock
  const packageJson = standalone ? BOOTSTRAP_EXE_PACKAGE_JSON : BOOTSTRAP_PNPM_PACKAGE_JSON
  await writeFile(path.join(dest, 'package.json'), packageJson)
  await writeFile(path.join(dest, 'package-lock.json'), JSON.stringify(lockfile))

  // Prepend the action's node directory to PATH so npm's
  // `#!/usr/bin/env node` shebang resolves on runners (e.g. GHE
  // self-hosted) where node isn't already on PATH. npm itself is
  // resolved via PATH — on the GitHub Actions runner it is not
  // co-located with `process.execPath`.
  const nodeDir = path.dirname(process.execPath)
  // On Windows, the PATH key casing varies; search case-insensitively.
  const pathKey = Object.keys(process.env).find(k => k.toUpperCase() === 'PATH') ?? 'PATH'
  const currentPath = process.env[pathKey]
  const npmEnv = { ...process.env, [pathKey]: currentPath ? nodeDir + path.delimiter + currentPath : nodeDir }
  const npmExitCode = await runCommand('npm', ['ci'], { cwd: dest, env: npmEnv })
  if (npmExitCode !== 0) {
    return npmExitCode
  }

  // On Windows with standalone mode, npm's .bin shims can't properly
  // execute the extensionless @pnpm/exe native binaries. Add the
  // @pnpm/exe directory directly to PATH so pnpm.exe is found natively.
  const pnpmHome = standalone && process.platform === 'win32'
    ? path.join(dest, 'node_modules', '@pnpm', 'exe')
    : path.join(dest, 'node_modules', '.bin')
  // PNPM_HOME/bin is where `pnpm self-update` places the target version
  // binary. It must have higher PATH precedence than pnpmHome (which
  // contains the bootstrap binary) so the self-updated version is found
  // first. The bootstrap pnpm is invoked via absolute path, not PATH,
  // so this ordering does not affect the bootstrap step.
  addPath(pnpmHome)
  addPath(path.join(pnpmHome, 'bin'))
  exportVariable('PNPM_HOME', pnpmHome)

  // Ensure pnpm bin link exists — npm ci sometimes doesn't create it
  if (process.platform !== 'win32') {
    const pnpmBinLink = path.join(dest, 'node_modules', '.bin', 'pnpm')
    if (!existsSync(pnpmBinLink)) {
      await mkdir(path.join(dest, 'node_modules', '.bin'), { recursive: true })
      const target = standalone
        ? path.join('..', '@pnpm', 'exe', 'pnpm')
        : path.join('..', 'pnpm', 'bin', 'pnpm.mjs')
      await symlink(target, pnpmBinLink)
    }
  }

  const bootstrapPnpm = standalone
    ? path.join(dest, 'node_modules', '@pnpm', 'exe', process.platform === 'win32' ? 'pnpm.exe' : 'pnpm')
    : path.join(dest, 'node_modules', 'pnpm', 'bin', 'pnpm.mjs')

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

  let packageManager: string | undefined
  let devEngines: { packageManager?: { name?: string; version?: string } } | undefined

  if (GITHUB_WORKSPACE) {
    try {
      const content = readFileSync(path.join(GITHUB_WORKSPACE, packageJsonFile), 'utf8');
      const manifest = packageJsonFile.endsWith(".yaml")
        ? parseYaml(content, { merge: true })
        : JSON.parse(content)
      packageManager = manifest.packageManager
      devEngines = manifest.devEngines
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

  // pnpm will automatically download and switch to the right version
  if (typeof packageManager === 'string' && packageManager.startsWith('pnpm@')) {
    return undefined
  }

  if (devEngines?.packageManager?.name === 'pnpm' && devEngines.packageManager.version) {
    return undefined
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
  - in the package.json with the key "packageManager"
  - in the package.json with the key "devEngines.packageManager"`)
}

function getSystemNodeVersion(): Promise<{ major: number; minor: number }> {
  return new Promise((resolve) => {
    const cp = spawn('node', ['--version'], { stdio: ['pipe', 'pipe', 'pipe'], shell: process.platform === 'win32' })
    let output = ''
    cp.stdout.on('data', (data: Buffer) => { output += data.toString() })
    cp.on('close', () => {
      const match = output.match(/^v(\d+)\.(\d+)/)
      resolve(match ? { major: parseInt(match[1], 10), minor: parseInt(match[2], 10) } : { major: 0, minor: 0 })
    })
    cp.on('error', () => resolve({ major: 0, minor: 0 }))
  })
}

function runCommand(cmd: string, args: string[], opts: { cwd: string; env?: Record<string, string | undefined> }): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    const cp = spawn(cmd, args, {
      cwd: opts.cwd,
      env: opts.env,
      stdio: ['pipe', 'inherit', 'inherit'],
      shell: process.platform === 'win32',
    })
    cp.on('error', reject)
    cp.on('close', resolve)
  })
}

export default runSelfInstaller
