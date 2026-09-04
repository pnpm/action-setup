#!/usr/bin/env node

import { execSync } from 'child_process'
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

const BOOTSTRAP_DIR = new URL('../src/install-pnpm/bootstrap/', import.meta.url).pathname

const legacyVersion = process.argv[2] || resolveLatestVersion(11)
const nativeVersion = process.argv[3] || resolveLatestVersion(12)

console.log(`Updating bootstrap lockfiles to pnpm@${legacyVersion} and pnpm@${nativeVersion} ...`)

generateLock('pnpm-lock.json', { pnpm: legacyVersion }, 'bootstrap-pnpm')
generateLock('exe-lock.json', { '@pnpm/exe': legacyVersion }, 'bootstrap-exe')
generateLock('native-lock.json', { pnpm: nativeVersion }, 'bootstrap-native-pnpm')

console.log('Done!')

function resolveLatestVersion(major) {
  const json = execSync('npm view pnpm dist-tags --json', { encoding: 'utf8' })
  const parsed = JSON.parse(json)
  const tags = Array.isArray(parsed) ? parsed[0] : parsed
  const version = tags[`next-${major}`] || tags[`latest-${major}`]
  if (!version) {
    console.error(`Could not determine latest pnpm v${major} version from npm dist-tags`)
    process.exit(1)
  }
  return version
}

function generateLock(filename, dependencies, name) {
  const tmp = mkdtempSync(join(tmpdir(), 'pnpm-bootstrap-'))
  try {
    writeFileSync(join(tmp, 'package.json'), JSON.stringify({ private: true, dependencies }))
    execSync('npm install --package-lock-only --ignore-scripts', { cwd: tmp, stdio: 'pipe' })
    const lock = readFileSync(join(tmp, 'package-lock.json'), 'utf8')
    const parsed = JSON.parse(lock)
    parsed.name = name
    writeFileSync(join(BOOTSTRAP_DIR, filename), JSON.stringify(parsed, null, 2) + '\n')
    const [packageName, packageVersion] = Object.entries(dependencies)[0]
    console.log(`  ${filename} -> ${packageName}@${packageVersion}`)
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
}
