import { spawn } from 'child_process'
import { execPath } from 'process'
import { downloadSelfInstaller } from '../self-installer'
import { Inputs } from '../inputs'

export async function runSelfInstaller(inputs: Inputs): Promise<number> {
  const cp = spawn(execPath, {
    env: {
      PNPM_VERSION: inputs.version,
      PNPM_DEST: inputs.dest,
      PNPM_BIN_DEST: inputs.binDest,
      PNPM_REGISTRY: inputs.registry,
    },
    stdio: ['pipe', 'inherit', 'inherit'],
  })

  const response = await downloadSelfInstaller()
  response.body.pipe(cp.stdin)

  return new Promise((resolve, reject) => {
    cp.on('error', reject)
    cp.on('close', resolve)
  })
}

export default runSelfInstaller
