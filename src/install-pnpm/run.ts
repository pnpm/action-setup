import { addPath, exportVariable } from '@actions/core'
import { spawn } from 'child_process'
import { rm, writeFile, mkdir, symlink } from 'fs/promises'
import { readFileSync, existsSync } from 'fs'
import path from 'path'
import util from 'util'
import { Inputs } from '../inputs'
import { parse as parseYaml } from 'yaml'
import { satisfies, subset, validRange } from 'semver'
import pnpmLock from './bootstrap/pnpm-lock.json'
import exeLock from './bootstrap/exe-lock.json'
import nativeLock from './bootstrap/native-lock.json'

const bootstrapPnpmVersion = pnpmLock.packages['node_modules/pnpm'].version
const bootstrapExeVersion = exeLock.packages['node_modules/@pnpm/exe'].version
const bootstrapNativeVersion = nativeLock.packages['node_modules/pnpm'].version
const BOOTSTRAP_PNPM_PACKAGE_JSON = JSON.stringify({
  private: true,
  dependencies: { pnpm: bootstrapPnpmVersion },
})
const BOOTSTRAP_EXE_PACKAGE_JSON = JSON.stringify({
  private: true,
  dependencies: { '@pnpm/exe': bootstrapExeVersion },
  allowScripts: { [`@pnpm/exe@${bootstrapExeVersion}`]: true },
})
const BOOTSTRAP_NATIVE_PACKAGE_JSON = JSON.stringify({
  private: true,
  dependencies: { pnpm: bootstrapNativeVersion },
  allowScripts: { [`pnpm@${bootstrapNativeVersion}`]: true },
})

export interface SelfInstallerResult {
  exitCode: number
  binDest: string
}

export async function runSelfInstaller(inputs: Inputs): Promise<SelfInstallerResult> {
  const { version, dest, packageJsonFile } = inputs
  const targetVersion = readTargetVersion({ version, packageJsonFile })
  const native = targetsPnpm12(targetVersion)
  let standalone = false
  if (!native) {
    const systemNode = await getSystemNodeVersion()
    standalone = inputs.standalone || systemNode.major < 22 || (systemNode.major === 22 && systemNode.minor < 13)
  }

  // Install bootstrap pnpm via npm (integrity verified by committed lockfile)
  await rm(dest, { recursive: true, force: true })
  await mkdir(dest, { recursive: true })

  const lockfile = native ? nativeLock : standalone ? exeLock : pnpmLock
  const packageJson = native ? BOOTSTRAP_NATIVE_PACKAGE_JSON : standalone ? BOOTSTRAP_EXE_PACKAGE_JSON : BOOTSTRAP_PNPM_PACKAGE_JSON
  await writeFile(path.join(dest, 'package.json'), packageJson)
  await writeFile(path.join(dest, 'package-lock.json'), JSON.stringify(lockfile))

  // Append the action's node directory to PATH so npm's
  // `#!/usr/bin/env node` shebang resolves on runners (e.g. GHE
  // self-hosted) where node isn't already on PATH. Append (not
  // prepend) so a user-installed toolchain on PATH — e.g. from a
  // prior `setup-node` step — keeps precedence; otherwise the
  // runner-bundled node would shadow it and pair the user's npm
  // with a mismatched node version. npm itself is resolved via
  // PATH — on the GitHub Actions runner it is not co-located with
  // `process.execPath`.
  const nodeDir = path.dirname(process.execPath)
  // On Windows, the PATH key casing varies; search case-insensitively.
  const pathKey = Object.keys(process.env).find(k => k.toUpperCase() === 'PATH') ?? 'PATH'
  const currentPath = process.env[pathKey]
  const npmEnv = { ...process.env, [pathKey]: currentPath ? currentPath + path.delimiter + nodeDir : nodeDir }
  const npmExitCode = await runCommand('npm', ['ci'], { cwd: dest, env: npmEnv })
  if (npmExitCode !== 0) {
    return { exitCode: npmExitCode, binDest: path.join(dest, 'node_modules', '.bin') }
  }

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
      const target = native
        ? path.join('..', 'pnpm', 'pnpm')
        : standalone
          ? path.join('..', '@pnpm', 'exe', 'pnpm')
          : path.join('..', 'pnpm', 'bin', 'pnpm.mjs')
      await symlink(target, pnpmBinLink)
    }
  }

  const bootstrapPnpm = native
    ? path.join(dest, 'node_modules', 'pnpm', process.platform === 'win32' ? 'pnpm.exe' : 'pnpm')
    : standalone
      ? path.join(dest, 'node_modules', '@pnpm', 'exe', process.platform === 'win32' ? 'pnpm.exe' : 'pnpm')
      : path.join(dest, 'node_modules', 'pnpm', 'bin', 'pnpm.mjs')
  const bootstrapVersion = native ? bootstrapNativeVersion : standalone ? bootstrapExeVersion : bootstrapPnpmVersion

  if (targetVersion === bootstrapVersion || (native && satisfies(bootstrapVersion, targetVersion))) {
    return { exitCode: 0, binDest: pnpmHome }
  }

  const cmd = native || standalone ? bootstrapPnpm : process.execPath
  const args = native || standalone ? ['self-update', targetVersion] : [bootstrapPnpm, 'self-update', targetVersion]
  const exitCode = await runCommand(cmd, args, { cwd: dest })
  if (exitCode !== 0) {
    return { exitCode, binDest: pnpmHome }
  }
  // self-update writes the target pnpm/pnpx into PNPM_HOME/bin, leaving
  // the bootstrap symlinks in pnpmHome pointing at the old version. Use
  // PNPM_HOME/bin so consumers of the bin_dest output (e.g.
  // `${steps.pnpm.outputs.bin_dest}/pnpm`) invoke the requested version.
  //
  // When the requested version resolves to the bootstrap version, self-update
  // is a no-op and PNPM_HOME/bin is not created — fall back to pnpmHome,
  // whose symlinks already point at the right version.
  const updatedBinDir = path.join(pnpmHome, 'bin')
  return { exitCode: 0, binDest: existsSync(updatedBinDir) ? updatedBinDir : pnpmHome }
}

function readTargetVersion(opts: {
  readonly version?: string | undefined
  readonly packageJsonFile: string
}): string {
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

  // packageManager is always exact `pnpm@<version>[+<integrity>]` per spec.
  // Strip the integrity hash for self-update.
  const packageManagerVersion =
    typeof packageManager === 'string' && packageManager.startsWith('pnpm@')
      ? packageManager.slice('pnpm@'.length).split('+')[0]
      : undefined

  if (version) {
    if (packageManagerVersion && packageManagerVersion !== version) {
      throw new Error(`Multiple versions of pnpm specified:
  - version ${version} in the GitHub Action config with the key "version"
  - version ${packageManager} in the package.json with the key "packageManager"
Remove one of these versions to avoid version mismatch errors like ERR_PNPM_BAD_PM_VERSION`)
    }

    return version
  }

  // Self-update the bootstrap pnpm to the version pinned in package.json so
  // PATH-resolved `pnpm` (and the bin_dest output) reflect the target
  // version. Without this, `pnpm store path` runs as the bootstrap and
  // reports a different STORE_VERSION than the one the user's actual
  // install writes to — breaking cache: true and actions/setup-node's
  // `cache: pnpm` on cold caches (issue #233).
  //
  // devEngines.packageManager takes priority over packageManager, matching
  // pnpm's getWantedPackageManager logic. `pnpm self-update` accepts both
  // exact versions and semver ranges, so we pass either through directly.
  if (devEngines?.packageManager?.name === 'pnpm' && devEngines.packageManager.version) {
    return devEngines.packageManager.version
  }

  if (packageManagerVersion) {
    return packageManagerVersion
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

function targetsPnpm12(version: string): boolean {
  if (version === 'latest-12' || version === 'next-12') return true
  const range = validRange(version)
  return range !== null && subset(range, '>=12.0.0 <13.0.0')
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
