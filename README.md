# Setup pnpm

Install pnpm package manager.

## Inputs

### `version`

Can either specifiy a specific version of pnpm to install (e.g. "6.14.6") or can
specifiy a version range (in the [semver range
format](https://github.com/npm/node-semver#ranges)).  The latest version to
match the range is used and if the input version is not specified, the latest
overall version is used.  Version ranges are only supported for versions
starting at 6.13.0 and higher, because that is the first version of pnpm to be
published to github releases.

### `dest`

This option is obsolete.  It is only used when a specific version of pnpm which
is 6.12 or lower is specified.  For these old versions of pnpm, the `dest` input
is where to store pnpm files.

### `run_install`

If specified, run `pnpm install`.

If `run_install` is either `null` (the default) or `false`, pnpm will not install any npm package.

If `run_install` is `true`, pnpm will install dependencies recursively.

If `run_install` is a YAML string representation of either an object or an array, pnpm will execute every install commands.

#### `run_install.recursive`

(_type:_ `boolean`, _default:_ `false`) Whether to use `pnpm recursive install`.

#### `run_install.cwd`

(_type:_ `string`) Working directory when run `pnpm [recursive] install`.

#### `run_install.args`

(_type:_ `string[]`) Additional arguments after `pnpm [recursive] install`, e.g. `[--frozen-lockfile, --strict-peer-dependencies]`.

## Outputs

### `bin_dest`

Folder containing the `pnpm` executable.

### `dest`

Expanded path of inputs#dest, only set if a version before "6.14.6" is specified.

## Usage example

### Install latest pnpm and cache store

The following yaml will first install the latest version of pnpm, install node,
and setup caching of the pnpm store.
[actions/setup-node](https://github.com/actions/setup-node) has support for
caching the pnpm store, as long as pnpm is installed first.

```yaml
steps:
  - uses: actions/checkout@v2
  - uses: pnpm/action-setup@v2.0.1
  - uses: actions/setup-node@v2
    with:
      node-version: "16"
      cache: "pnpm"

  - run: pnpm install --frozen-lockfile

  # more build/run commands ...

  - run: pnpm store prune
```

### Install specific range of pnpm

```yaml
steps:
  - uses: actions/checkout@v2

  - uses: pnpm/action-setup@v2.0.1
    with:
      version: "^6.14.6"

  - uses: actions/setup-node@v2
    with:
      node-version: "16"
      cache: "pnpm"

  - run: pnpm install --frozen-lockfile

  # more build/run commands ...

  - run: pnpm store prune
```

### Install pnpm and a few npm packages

Unfortunately, using `run_install` does not work together with the caching
in `actions/setup-node`.  The caching in `actions/setup-node` requires pnpm
to be installed before node, while the `run_install` option
requires node to be installed first.  In this situation, you will need to setup
the caching yourself.

```yaml
steps:
  - uses: actions/checkout@v2

  - uses: actions/setup-node@v2
    with:
      node-version: "16"

  - uses: pnpm/action-setup@v2.0.1
    with:
      version: "6.*"
      run_install: |
        - recursive: true
          args: [--frozen-lockfile, --strict-peer-dependencies]
        - args: [--global, gulp, prettier, typescript]

  # Setup caching here using actions/cache
```

## License

[MIT](https://git.io/JfclH) © [Hoàng Văn Khải](https://github.com/KSXGitHub/)
