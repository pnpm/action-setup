import { getInput, error } from '@actions/core'
import * as yaml from 'yaml'
import { z, ZodError } from 'zod'

const RunInstallSchema = z.object({
  recursive: z.boolean().optional(),
  cwd: z.string().optional(),
  args: z.array(z.string()).optional(),
})

const RunInstallInputSchema = z.union([
  z.null(),
  z.boolean(),
  RunInstallSchema,
  z.array(RunInstallSchema),
])

export type RunInstallInput = z.infer<typeof RunInstallInputSchema>
export type RunInstall = z.infer<typeof RunInstallSchema>

export function parseRunInstall(inputName: string): RunInstall[] {
  const input = getInput(inputName, { required: true })
  const parsedInput: unknown = yaml.parse(input)

  try {
    const result: RunInstallInput = RunInstallInputSchema.parse(parsedInput)
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
