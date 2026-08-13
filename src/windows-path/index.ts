/**
 * pnpm may report an extended-length path on Windows. The `?` in that prefix
 * is interpreted as a wildcard by `@actions/cache`, which rejects it as a glob
 * in the root segment. Cache APIs do not need the extended-length form, so
 * convert it back to a regular drive or UNC path.
 */
export function removeWindowsExtendedPathPrefix(cachePath: string): string {
  const extendedPathPrefix = '\\\\?\\'
  if (!cachePath.startsWith(extendedPathPrefix)) return cachePath

  const pathWithoutPrefix = cachePath.slice(extendedPathPrefix.length)
  const uncPrefix = 'UNC\\'
  if (pathWithoutPrefix.toUpperCase().startsWith(uncPrefix)) {
    return `\\\\${pathWithoutPrefix.slice(uncPrefix.length)}`
  }
  return pathWithoutPrefix
}

export default removeWindowsExtendedPathPrefix
