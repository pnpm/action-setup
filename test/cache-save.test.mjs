import assert from 'node:assert/strict'
import { mkdtemp, rm, access } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, beforeEach, mock, test } from 'node:test'

const directory = await mkdtemp(join(tmpdir(), 'pnpm-cache-save-'))
after(() => rm(directory, { recursive: true, force: true }))
let state
let checkAccess
const saveCache = mock.fn(async () => 1)
mock.module('@actions/cache', { namedExports: { saveCache } })
mock.module('@actions/core', {
  namedExports: { getState: name => state[name], info: () => {} },
})
mock.module('fs/promises', { namedExports: { access: path => checkAccess(path) } })
const { runSaveCache } = await import('../src/cache-save/run.ts')

beforeEach(() => {
  state = { cache_restored_key: 'old', cache_primary_key: 'new', cache_path: directory }
  checkAccess = access
  saveCache.mock.resetCalls()
})

test('skips saving a missing directory', async () => {
  state.cache_path = join(directory, 'missing')
  await runSaveCache()
  assert.equal(saveCache.mock.callCount(), 0)
})

test('saves an existing directory with the primary key', async () => {
  await runSaveCache()
  assert.deepEqual(saveCache.mock.calls[0].arguments, [[directory], 'new'])
})

test('skips saving a primary-key cache hit', async () => {
  state.cache_restored_key = 'new'
  await runSaveCache()
  assert.equal(saveCache.mock.callCount(), 0)
})

test('propagates unexpected filesystem errors', async () => {
  const error = Object.assign(new Error('access denied'), { code: 'EACCES' })
  checkAccess = async () => { throw error }
  await assert.rejects(runSaveCache(), error)
  assert.equal(saveCache.mock.callCount(), 0)
})
