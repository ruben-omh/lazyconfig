# @lazyconfig/scripts

[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub Sponsors](https://img.shields.io/github/sponsors/ruben-omh?logo=github)](https://github.com/sponsors/ruben-omh)

Internal monorepo scripts for building and maintaining lazyconfig packages. **This package is private and not published to npm.**

## Scripts

### `build-types`

Generates bundled TypeScript declaration files for a package using `tsc` and `api-extractor`.

Runs all `tsc --emitDeclarationOnly` passes in parallel, then runs all `api-extractor` passes in parallel. When `--ext` is set, each rollup is additionally copied to a `.d.<ext>` counterpart (e.g. `.d.mts`, `.d.cts`) for dual-package consumers.

**Usage**

Via `bin` when `@lazyconfig/scripts` is installed as a `devDependency`:

```sh
build-types [options]
```

Or directly from within this package:

```sh
node src/build-types.js [options]
```

**Options**

| Flag     | Alias | Type       | Default                  | Description                                                                      |
| -------- | ----- | ---------- | ------------------------ | -------------------------------------------------------------------------------- |
| `--tsc`  | `-t`  | `string[]` | `["tsconfig.json"]`      | Paths to tsconfig files passed to `tsc --emitDeclarationOnly`.                   |
| `--aec`  | `-a`  | `string[]` | `["api-extractor.json"]` | Paths to `api-extractor.json` config files.                                      |
| `--ext`  | `-e`  | `string[]` | `[]`                     | Additional declaration extensions to emit alongside `.d.ts` (e.g. `mts`, `cts`). |
| `--mock` | `-m`  | `boolean`  | `false`                  | Log each step without executing any commands or copying files.                   |

**Examples**

```sh
# Run with defaults
build-types

# Custom tsconfig and api-extractor config
build-types --tsc tsconfig.lib.json --aec api-extractor.json

# Multiple configs
build-types --tsc tsconfig.lib.json --aec api-extractor.json api-extractor.node.json

# Also emit .d.mts and .d.cts copies for dual-package consumers
build-types --ext mts cts

# Dry run — verify the flow without side effects
build-types --mock
```

**Requirements**

`build-types` shells out to `tsc` and `api-extractor`. Make sure both are available as `devDependencies` in the package where the script is invoked.

---

### `commit-signoff`

Appends a `Signed-off-by` trailer to the commit message if not already present. Reads the commit author's name and email from the local git config and constructs a `Signed-off-by: Name <email>` footer. Exits early without modifying the file if the trailer is already present.

Intended to be used as a `prepare-commit-msg` git hook.

**Usage**

Via `bin` when `@lazyconfig/scripts` is installed as a `devDependency`:

```sh
commit-signoff [options]
```

Or directly from within this package:

```sh
node src/commit-signoff.js [options]
```

**Options**

| Flag        | Alias | Type      | Default                   | Description                                                           |
| ----------- | ----- | --------- | ------------------------- | --------------------------------------------------------------------- |
| `--msgFile` | `-f`  | `string`  | `$GIT_DIR/COMMIT_EDITMSG` | Path to the commit message file. Git passes this as `$1` in the hook. |
| `--mock`    | `-m`  | `boolean` | `false`                   | Log each step without executing any commands or writing files.        |

**Examples**

```sh
# Run with defaults (resolves $GIT_DIR/COMMIT_EDITMSG)
commit-signoff

# Explicit path (required in git worktrees)
commit-signoff --msgFile .git/worktrees/my-worktree/COMMIT_EDITMSG

# Dry run — verify the flow without side effects
commit-signoff --mock
```

**Hook setup**

```sh
# .husky/prepare-commit-msg
commit-signoff --msgFile "$1"
```

**Requirements**

`commit-signoff` shells out to `git config`. Make sure `git` is available in the environment where the hook runs.

---

## Utils

Internal helpers used by the scripts. Not intended for direct use by other packages.

- `src/utils/logger.js` — scoped consola logger factory
- `src/utils/run-command.js` — `runCommand` / `runCommandSync` wrappers around `spawn` and `execFileSync`
