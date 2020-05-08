import { spawnSync } from 'child_process'
import { downloadSelfInstaller } from '../self-installer'
import { Inputs } from '../inputs'

export async function runSelfInstaller(inputs: Inputs) {
  return spawnSync('node', {
    env: {
      PNPM_VERSION: inputs.version,
      PNPM_DEST: inputs.dest,
      PNPM_BIN_DEST: inputs.binDest,
      PNPM_REGISTRY: inputs.registry,
    },
    input: await downloadSelfInstaller(),
    stdio: 'inherit',
  })
}

export default runSelfInstaller
