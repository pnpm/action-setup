import { getInput, error } from '@actions/core'
import { parse as parseYaml } from 'yaml'
import * as z from 'zod'

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

export type RunInstall = z.infer<typeof RunInstallSchema>

export function parseRunInstall(inputName: string): RunInstall[] {
  const input = getInput(inputName, { required: true })
  const parsedInput: unknown = parseYaml(input)

  const result = RunInstallInputSchema.safeParse(parsedInput)
  if (!result.success) {
    error(`Error for input "${inputName}" = ${input}`)
    error(z.prettifyError(result.error))
    process.exit(1)
  }

  const { data } = result
  if (!data) return []
  if (data === true) return [{ recursive: true }]
  if (Array.isArray(data)) return data
  return [data]
}
