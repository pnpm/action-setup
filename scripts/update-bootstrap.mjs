#!/usr/bin/env node

// Usage: node scripts/update-bootstrap.mjs [version]
// If version is omitted, fetches the latest next-11 tag from npm.
// Regenerates the bootstrap lockfiles used by action-setup to install pnpm via npm.

import { execSync } from 'child_process'
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

const BOOTSTRAP_DIR = new URL('../src/install-pnpm/bootstrap/', import.meta.url).pathname

const version = process.argv[2] || resolveLatestVersion()

console.log(`Updating bootstrap lockfiles to pnpm@${version} ...`)

generateLock('pnpm-lock.json', { pnpm: version }, 'bootstrap-pnpm')
generateLock('exe-lock.json', { '@pnpm/exe': version }, 'bootstrap-exe')

console.log('Done!')

function resolveLatestVersion() {
  const json = execSync('npm view @pnpm/exe dist-tags --json', { encoding: 'utf8' })
  const tags = JSON.parse(json)
  const version = tags['next-11'] || tags['latest']
  if (!version) {
    console.error('Could not determine latest pnpm version from npm dist-tags')
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
    console.log(`  ${filename} -> ${Object.values(dependencies)[0]}@${version}`)
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
}
