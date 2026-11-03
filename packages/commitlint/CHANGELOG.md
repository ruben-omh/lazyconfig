# @lazyconfig/commitlint

## 0.1.1

### Patch Changes

- [`63072b3`](https://github.com/ruben-omh/lazyconfig/commit/63072b307e9205fb8823feab7af67f3e5dec2c64) Thanks [@ruben-omh](https://github.com/ruben-omh)! - Bundle `@commitlint/config-conventional` as a dependency. The preset's config extends it, but it was not declared, so installing `@lazyconfig/commitlint` on its own left the extends unresolved (`Cannot find module @commitlint/config-conventional`) unless the consumer installed it manually. It now ships with the preset, and consumers only add this package and the `@commitlint/cli` runner.

## 0.1.0

### Minor Changes

- [`4af3b37`](https://github.com/ruben-omh/lazyconfig/commit/4af3b37cb24bf9b28c471c33348171245d85bbed) Thanks [@ruben-omh](https://github.com/ruben-omh)! - Initial public release of the @lazyconfig preset packages.
