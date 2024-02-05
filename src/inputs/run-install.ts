import { getInput, error } from '@actions/core'
import * as yaml from 'yaml'
import { z, ZodError } from 'zod'

export interface RunInstall {
  readonly recursive?: boolean
  readonly cwd?: string
  readonly args?: readonly string[]
}

const zRunInstall = z.object({
  recursive: z.boolean().optional(),
  cwd: z.string().optional(),
  args: z.array(z.string()).optional(),
})

export type RunInstallInput =
  | null
  | boolean
  | RunInstall
  | RunInstall[]

const zRunInstallInput = z.union([
  z.null(),
  z.boolean(),
  zRunInstall,
  z.array(zRunInstall),
])

export function parseRunInstall(inputName: string): RunInstall[] {
  const input = getInput(inputName, { required: true })
  const parsedInput: unknown = yaml.parse(input)

  try {
    const result: RunInstallInput = zRunInstallInput.parse(parsedInput)
    if (!result) return []
    if (result === true) return [{ recursive: true }]
    if (Array.isArray(result)) return result
    return [result]
  } catch (exception: unknown) {
    error(`Error for input "${inputName}" = ${input}`)

    if (exception instanceof ZodError) {
      error(`Errors: ${exception.errors}`)
    } else {
      error(`Exception: ${exception}`)
    }
    process.exit(1)
  }
}
