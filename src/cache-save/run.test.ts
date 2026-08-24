import { saveCache } from '@actions/cache'
import { getState, info } from '@actions/core'
import { access } from 'fs/promises'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { runSaveCache } from './run'

vi.mock('@actions/cache', () => ({ saveCache: vi.fn() }))
vi.mock('@actions/core', () => ({ getState: vi.fn(), info: vi.fn() }))
vi.mock('fs/promises', () => ({ access: vi.fn() }))

const accessMock = vi.mocked(access)
const getStateMock = vi.mocked(getState)
const infoMock = vi.mocked(info)
const saveCacheMock = vi.mocked(saveCache)

describe('runSaveCache', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getStateMock
      .mockReturnValueOnce('restored-key')
      .mockReturnValueOnce('primary-key')
      .mockReturnValueOnce('/cache/path')
  })

  it('skips saving when the cache path is missing', async () => {
    accessMock.mockRejectedValue(Object.assign(new Error(), { code: 'ENOENT' }))

    await runSaveCache()

    expect(saveCacheMock).not.toHaveBeenCalled()
    expect(infoMock).toHaveBeenCalledWith(
      'Cache path /cache/path does not exist, not saving cache.',
    )
  })

  it('saves when the cache path exists', async () => {
    accessMock.mockResolvedValue(undefined)
    saveCacheMock.mockResolvedValue(1)

    await runSaveCache()

    expect(saveCacheMock).toHaveBeenCalledWith(['/cache/path'], 'primary-key')
  })

  it('rethrows unexpected access errors', async () => {
    const error = Object.assign(new Error(), { code: 'EACCES' })

    accessMock.mockRejectedValue(error)

    await expect(runSaveCache()).rejects.toBe(error)
    expect(saveCacheMock).not.toHaveBeenCalled()
  })
})
