# Setup PNPM

Install PNPM package manager.

## Inputs

### `version`

**Required** Version of PNPM to install.

### `dest`

**Optional** Where to store PNPM files.

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

**Optional** (_type:_ `string[]`) Additional arguments after `pnpm [recursive] install`, e.g. `[--frozen-lockfile, --strict-peer-dependencies]`.

## Outputs

### `dest`

Expanded path of inputs#dest.

### `bin_dest`

Location of `pnpm` and `pnpx` command.

## Usage example

### Just install PNPM

```yaml
on:
  - push
  - pull_request

jobs:
  runs-on: ubuntu-latest

  steps:
    - uses: pnpm/action-setup@v1.2.1
      with:
        version: 5.17.2
```

### Install PNPM and a few NPM packages

```yaml
on:
  - push
  - pull_request

jobs:
  runs-on: ubuntu-latest

  steps:
    - uses: actions/checkout@v2

    - uses: pnpm/action-setup@v1.2.1
      with:
        version: 5.17.2
        run_install: |
          - recursive: true
            args: [--frozen-lockfile, --strict-peer-dependencies]
          - args: [--global, gulp, prettier, typescript]
```

### Use cache to reduce installation time

```yaml
on:
  - push
  - pull_request

jobs:
  runs-on: ubuntu-latest

  steps:
    build:
      - uses: actions/checkout@v2

      - name: Cache pnpm modules
        uses: actions/cache@v2
        env:
          cache-name: cache-pnpm-modules
        with:
          path: ~/.pnpm-store
          key: ${{ runner.os }}-build-${{ env.cache-name }}-${{ matrix.node-version }}-${{ hashFiles('**/package.json') }}
          restore-keys: |
            ${{ runner.os }}-build-${{ env.cache-name }}-${{ matrix.node-version }}-

      - uses: pnpm/action-setup@v1.2.1
        with:
          version: 5.17.2
          run_install: true
```

**Note:** You don't need to run `pnpm store prune` at the end; post-action has already taken care of that.

## Notes

This action does not setup Node.js for you, use [actions/setup-node](https://github.com/actions/setup-node) yourself.

## License

[MIT](https://git.io/JfclH) © [Hoàng Văn Khải](https://github.com/KSXGitHub/)
