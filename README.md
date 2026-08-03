> [!IMPORTANT]
> **This action has a successor: [`pnpm/setup`](https://github.com/pnpm/setup).**
>
> For pnpm v11 and newer, use [`pnpm/setup`](https://github.com/pnpm/setup) instead. It downloads pnpm's self-contained release binary (no Node.js or npm required) and can install a JavaScript runtime (Node.js, Bun, or Deno) in the same step, replacing `actions/setup-node`.
>
> `pnpm/action-setup` remains the action to use for installing pnpm v10 and older. See [Migrating to pnpm/setup](#migrating-to-pnpmsetup) below.

# Setup pnpm

Install pnpm package manager.

> ## :warning: Upgrade from v2!
>
> The v2 version of this action [has stopped working](https://github.com/pnpm/action-setup/issues/135) with newer Node.js versions. Please, upgrade to the latest version to fix any issues.

## Migrating to pnpm/setup

[`pnpm/setup`](https://github.com/pnpm/setup) installs pnpm v11+ as a native standalone executable and can install Node.js, Bun, or Deno in the same step, so a typical workflow no longer needs `actions/setup-node` or an explicit `pnpm install` step:

```yaml
steps:
  - uses: actions/checkout@v6

  # Before:
  # - uses: pnpm/action-setup@v6
  #   with:
  #     version: 10
  #     cache: true
  # - uses: actions/setup-node@v4
  #   with:
  #     node-version: 22
  # - run: pnpm install

  # After:
  - uses: pnpm/setup@v1
    with:
      version: 11
      runtime: node@22
      cache: true
```

The `version` input can be omitted only when `packageManager` (or `devEngines.packageManager`) in `package.json` declares pnpm v11 or newer; otherwise keep it explicit, since `pnpm/setup` requires pnpm v11+.

Input and output changes:

| `pnpm/action-setup` | `pnpm/setup` | Notes |
| ------------------- | ------------ | ----- |
| `version` | `version` | Must resolve to pnpm v11 or newer. As before, it can be omitted when `packageManager` (or `devEngines.packageManager`) is set in `package.json`. |
| `dest` | `dest` | Unchanged. |
| `run_install` | `install` | `pnpm/setup` runs `pnpm install` automatically when a `package.json` is present (`install: true` by default); set `install: false` to skip it. The object/array form (`recursive`, `cwd`, `args`) is not supported — run those commands in separate steps. |
| `cache` | `cache` | Unchanged. |
| `cache_dependency_path` | `cache-dependency-path` | Renamed to kebab-case. |
| `package_json_file` | `package-json-file` | Renamed to kebab-case. |
| `standalone` | removed | `pnpm/setup` always installs the standalone native executable. |
| n/a | `runtime` | New: installs Node.js, Bun, or Deno (e.g. `node@22`, `bun@latest`, `deno@2`), or reads `devEngines.runtime` from `package.json`. |
| n/a | `token` | New: GitHub token for release lookup; defaults to `${{ github.token }}` and rarely needs to be set. |
| `bin_dest` (output) | `bin-dest` (output) | Renamed to kebab-case. New outputs `runtime-name` and `runtime-version` describe the installed runtime. |

## Inputs

### `version`

Version of pnpm to install.

**Optional** when there is a [`packageManager` or `devEngines.packageManager` field in the `package.json`](https://nodejs.org/api/corepack.html).

otherwise, this field is **required** It supports npm versioning scheme, it could be an exact version (such as `10.9.8`), or a version range (such as `10`, `10.x.x`, `10.9.x`, `^10.9.8`, `*`, etc.), or `latest`.

### `dest`

**Optional** Where to store pnpm files.

### `run_install`

**Optional** (_default:_ `null`) If specified, run `pnpm install`.

If `run_install` is either `null` or `false`, pnpm will not install any npm package.

If `run_install` is `true`, pnpm will install dependencies recursively.

If `run_install` is a YAML string representation of either an object or an array, pnpm will execute every install commands.

#### `run_install.recursive`

**Optional** (_type:_ `boolean`, _default:_ `false`) Whether to use `pnpm recursive install`.

#### `run_install.cwd`

**Optional** (_type:_ `string`) Working directory when run `pnpm [recursive] install`.

#### `run_install.args`

**Optional** (_type:_ `string[]`) Additional arguments after `pnpm [recursive] install`, e.g. `[--ignore-scripts, --strict-peer-dependencies]`.

### `cache`

**Optional** (_type:_ `boolean`, _default:_ `false`) Whether to cache the pnpm store directory.

### `cache_dependency_path`

**Optional** (_type:_ `string`, _default:_ `pnpm-lock.yaml`) File path to the pnpm lockfile, whose contents hash will be used as a cache key. Accepts multiple paths delimited by newlines.

### `package_json_file`

**Optional** (_type:_ `string`, _default:_ `package.json`) File path to the `package.json`/[`package.yaml`](https://github.com/pnpm/pnpm/pull/1799) to read `packageManager` or `devEngines.packageManager` configuration.

### `standalone`

**Optional** (_type:_ `boolean`, _default:_ `false`) When set to true, [@pnpm/exe](https://www.npmjs.com/package/@pnpm/exe), which is a Node.js bundled package, will be installed, enabling using `pnpm` without Node.js.

This is useful when you want to use a incompatible pair of Node.js and pnpm.

## Outputs

### `dest`

Expanded path of inputs#dest.

### `bin_dest`

Location of `pnpm` and `pnpx` command.

## Usage example

### Install only pnpm without `packageManager`

This works when the repo either doesn't have a `package.json` or has a `package.json` but it doesn't specify `packageManager` or `devEngines.packageManager`.

```yaml
on:
  - push
  - pull_request

jobs:
  install:
    runs-on: ubuntu-latest

    steps:
      - uses: pnpm/action-setup@v6
        with:
          version: 10
```

###  Install only pnpm with `packageManager`

Omit `version` input to use the version in the [`packageManager` or `devEngines.packageManager` field in the `package.json`](https://nodejs.org/api/corepack.html).

```yaml
on:
  - push
  - pull_request

jobs:
  install:
    runs-on: ubuntu-latest

    steps:
      - uses: pnpm/action-setup@v6
```

### Install pnpm and a few npm packages

```yaml
on:
  - push
  - pull_request

jobs:
  install:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v6

      - uses: pnpm/action-setup@v6
        with:
          version: 10
          run_install: |
            - recursive: true
              args: [--strict-peer-dependencies]
            - args: [--global, gulp, prettier, typescript]
```

### Use cache to reduce installation time

```yaml
on:
  - push
  - pull_request

jobs:
  cache-and-install:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v6

      - uses: pnpm/action-setup@v6
        name: Install pnpm
        with:
          version: 10
          cache: true

      - name: Install dependencies
        run: pnpm install
```

**Note:** You don't need to run `pnpm store prune` at the end; post-action has already taken care of that.

### Cache dependencies from multiple lockfiles

```yaml
on:
  - push
  - pull_request

jobs:
  cache-and-install-multiple:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v6

      - uses: pnpm/action-setup@v6
        with:
          version: 10
          cache: true
          cache_dependency_path: |
            one/pnpm-lock.yaml
            two/pnpm-lock.yaml
          run_install: |
            - cwd: one
            - cwd: two
```

## Notes

This action does not set up Node.js. Use [actions/setup-node](https://github.com/actions/setup-node) yourself. If you are on pnpm v11 or newer, [`pnpm/setup`](https://github.com/pnpm/setup) can install pnpm and Node.js in a single step.

## License

[MIT](https://github.com/pnpm/action-setup/blob/master/LICENSE.md) © [Hoàng Văn Khải](https://github.com/KSXGitHub/)
