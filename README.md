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
