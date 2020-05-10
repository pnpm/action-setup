# Setup PNPM

Install PNPM package manager.

## Inputs

### `version`

**Required** Version of PNPM to install.

### `dest`

**Optional** Where to store PNPM files.

### `bin_dest`

**Optional** Where to store executables (`pnpm` and `pnpx` commands).

### `registry`

**Optional** (_default:_ `https://registry.npmjs.com`) Registry to download PNPM from.

### `run_install`

**Optional** (_default:_ `null`) If specified, run `pnpm install`.

If `run_install` is either `null` or `false`, pnpm will not install any npm package.

If `run_install` is `true`, pnpm will install dependencies recursively.

If `run_install` is a YAML representation of either an object or an array, pnpm will execute every install commands.

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

Expanded path of inputs#bin_dest.

## Usage example

```yaml
on:
  - push
  - pull_request

jobs:
  runs-on: ubuntu-latest

  steps:
    - uses: actions/checkout@v2

    - uses: pnpm/action-setup@v1.1.0
      with:
        version: 4.11.1

    - name: Install dependencies
      run: pnpm install
```

## Notes

This action does not setup Node.js for you, use [actions/setup-node](https://github.com/actions/setup-node) yourself.

## License

[MIT](https://git.io/JfclH) © [Hoàng Văn Khải](https://github.com/KSXGitHub/)
