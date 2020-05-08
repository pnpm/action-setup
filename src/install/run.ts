import { spawn } from 'child_process'
import { downloadSelfInstaller } from '../self-installer'
import { Inputs } from '../inputs'

export function runSelfInstaller(inputs: Inputs): Promise<number> {
  const cp = spawn('node', {
    env: {
      PNPM_VERSION: inputs.version,
      PNPM_DEST: inputs.dest,
      PNPM_BIN_DEST: inputs.binDest,
      PNPM_REGISTRY: inputs.registry,
    },
    stdio: ['pipe', 'inherit', 'inherit'],
  })

  downloadSelfInstaller().pipe(cp.stdin)

  return new Promise((resolve, reject) => {
    cp.on('error', reject)
    cp.on('close', resolve)
  })
}

export default runSelfInstaller
