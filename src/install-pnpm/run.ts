import { addPath, exportVariable } from '@actions/core'
import { spawn } from 'child_process'
import { rm, writeFile, mkdir } from 'fs/promises'
import { readFileSync, existsSync } from 'fs'
import path from 'path'
import { execPath } from 'process'
import util from 'util'
import { Inputs } from '../inputs'

export async function runSelfInstaller(inputs: Inputs): Promise<number> {
  const { version, versionFilePath, dest, packageJsonFile, standalone } = inputs

  // prepare self install
  await rm(dest, { recursive: true, force: true })
  // create dest directory after removal
  await mkdir(dest, { recursive: true })
  const pkgJson = path.join(dest, 'package.json')
  // we have ensured the dest directory exists, we can write the file directly
  await writeFile(pkgJson, JSON.stringify({ private: true }))

  // prepare target pnpm
  const target = await readTarget({ version, versionFilePath, packageJsonFile, standalone })
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

// Nearly identical to the function `actions/setup-node` uses.
// See https://github.com/actions/setup-node/blob/39370e3970a6d050c480ffad4ff0ed4d3fdee5af/src/util.ts#L8
function getPnpmVersionFromFile(versionFilePath: string) {
  if (!existsSync(versionFilePath)) {
    throw new Error(
      `The specified pnpm version file at: ${versionFilePath} does not exist`
    )
  }

  const contents = readFileSync(versionFilePath, 'utf8')

  // Try parsing the file as a `package.json` file.
  try {
    const manifest = JSON.parse(contents)

    // Presume package.json file.
    if (typeof manifest === 'object' && !!manifest) {
      // Support Volta.
      // See https://docs.volta.sh/guide/understanding#managing-your-project
      if (manifest.volta?.pnpm) {
        return manifest.volta.pnpm as string
      }

      if (manifest.engines?.pnpm) {
        return manifest.engines.pnpm as string
      }

      // Support Volta workspaces.
      // See https://docs.volta.sh/advanced/workspaces
      if (manifest.volta?.extends) {
        const extendedFilePath = path.resolve(
          path.dirname(versionFilePath),
          manifest.volta.extends
        )
        console.info('Resolving pnpm version from ' + extendedFilePath)
        return getPnpmVersionFromFile(extendedFilePath)
      }

      // If contents are an object, we parsed JSON
      // this can happen if pnpm-version-file is a package.json
      // yet contains no volta.pnpm or engines.pnpm
      //
      // If pnpm-version file is _not_ JSON, control flow
      // will not have reached these lines.
      //
      // And because we've reached here, we know the contents
      // *are* JSON, so no further string parsing makes sense.
      return
    }
  } catch {
    console.info('pnpm version file is not JSON file')
  }

  const found = contents.match(/^(?:pnpm\s+)?v?(?<version>[^\s]+)$/m)
  return found?.groups?.version ?? contents.trim()
}

async function readTarget(opts: {
  readonly version?: string | undefined
  readonly versionFilePath?: string | undefined
  readonly packageJsonFile: string
  readonly standalone: boolean
}) {
  let { versionFilePath, packageJsonFile, standalone, version } = opts
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

  if (typeof versionFilePath === "string" && typeof version === "string") {
    throw new Error("Multiple version determination methods specified: 'version' and 'version_file_path'. Please specify only one.")
  }

  if (versionFilePath) {
    version = getPnpmVersionFromFile(versionFilePath)
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
If you've intended to let pnpm/action-setup read preferred pnpm version from the "packageManager" field in the package.json file,
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
