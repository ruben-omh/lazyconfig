# @lazyconfig/cli

[![npm](https://img.shields.io/npm/v/@lazyconfig/cli?style=flat-square&logo=npm&logoColor=white&color=FFCA28)](https://www.npmjs.com/package/@lazyconfig/cli)
[![Downloads](https://img.shields.io/npm/dm/@lazyconfig/cli?style=flat-square&logo=npm&logoColor=white&label=downloads&color=8957E5)](https://www.npmjs.com/package/@lazyconfig/cli)
[![Coverage](https://img.shields.io/codecov/c/github/ruben-omh/lazyconfig?flag=cli&style=flat-square&logo=codecov&logoColor=white&label=coverage)](https://app.codecov.io/gh/ruben-omh/lazyconfig/flags?flag=cli)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/npm/l/@lazyconfig/cli?style=flat-square&color=blue)](LICENSE)
[![Sponsor](https://img.shields.io/github/sponsors/ruben-omh?style=flat-square&logo=githubsponsors&logoColor=white&color=EA4AAA&label=Sponsor)](https://github.com/sponsors/ruben-omh)

Automation scripts for enforcing development workflows via git hooks and build pipelines.

Provides a `lazyconfig` CLI for common hook tasks — signing off commits automatically — and compiler commands for generating TypeScript declaration files.

---

## Requirements

- Node.js `>=22.0.0`
- pnpm `>=10.0.0`

Some commands shell out to external tools that must be installed separately in your project:

| Tool                       | Required by     | Install                                |
| -------------------------- | --------------- | -------------------------------------- |
| `typescript`               | `compile types` | `pnpm add -D typescript`               |
| `@microsoft/api-extractor` | `compile types` | `pnpm add -D @microsoft/api-extractor` |
| `git`                      | `hook` commands | available in the environment           |

---

## Installation

```sh
# pnpm
pnpm add -D @lazyconfig/cli

# npm
npm install --save-dev @lazyconfig/cli

# yarn
yarn add --dev @lazyconfig/cli

# bun
bun add --dev @lazyconfig/cli
```

---

## Quick Start

The examples below assume [Husky](https://typicode.github.io/husky/) is set up in your project and that `typescript` and `@microsoft/api-extractor` are installed as dev dependencies.

```sh
# .husky/prepare-commit-msg
lazyconfig hook commit-signoff -f $1
```

```json
// package.json
"scripts": {
  "dts": "lazyconfig compile types --tsc tsconfig.lib.json --aec api-extractor.json --ext mts cts"
}
```

> `--ext mts cts` emits `.d.mts` and `.d.cts` copies alongside the base `.d.ts`. Omit it if your package only ships a single `types` entry.

---

## Commands

### `compile types`

Generates a bundled `.d.ts` declaration file for a TypeScript library in two steps:

1. **`tsc`** — emits raw `.d.ts` files in parallel for each tsconfig using `--emitDeclarationOnly`.
2. **`api-extractor`** — bundles and trims the scattered declarations into a single production-ready `.d.ts` per config. Pass `--ext` to additionally copy each bundle to a `.d.<ext>` counterpart (e.g. `.d.mts`, `.d.cts`) for dual-package consumers.

```sh
# package.json
"dts": "lazyconfig compile types --tsc tsconfig.lib.json --aec api-extractor.json --ext mts cts"
```

Requires the following to be installed and present in the project:

- [`typescript`](https://www.typescriptlang.org/) — used by `tsc` to emit declaration files
- [`@microsoft/api-extractor`](https://api-extractor.com/) — used to bundle and trim the declarations
- A `tsconfig.json` (or equivalent) with `declarationDir` or `outDir` configured
- An `api-extractor.json` config pointing to the emitted declarations

| Option    | Alias | Type       | Description                                                                                                          |
| --------- | ----- | ---------- | -------------------------------------------------------------------------------------------------------------------- |
| `--tsc`   | `-p`  | `string[]` | One or more tsconfig file paths passed to `tsc`. Defaults to `["tsconfig.json"]`.                                    |
| `--aec`   | `-a`  | `string[]` | One or more api-extractor config file paths. Defaults to `["api-extractor.json"]`.                                   |
| `--ext`   | `-e`  | `string[]` | Additional declaration extensions to emit alongside `.d.ts` (e.g. `mts`, `cts`). Defaults to `[]` (no extra copies). |
| `--watch` | `-w`  | `boolean`  | Emit log messages during execution.                                                                                  |

#### Examples

```sh
# Generate declarations using default config files
lazyconfig compile types

# Multiple tsconfig files — runs tsc in parallel for each
lazyconfig compile types -p tsconfig.lib.json -p tsconfig.node.json

# Multiple api-extractor configs — bundles declarations in parallel for each
lazyconfig compile types -a api-extractor.json -a api-extractor.node.json

# Emit .d.mts and .d.cts copies alongside .d.ts for dual ESM/CJS type resolution
lazyconfig compile types -p tsconfig.lib.json -a api-extractor.json -e mts cts

# Combine both with verbose logging
lazyconfig compile types -p tsconfig.lib.json -a api-extractor.json -w
```

---

### `hook commit-signoff`

Appends a `Signed-off-by: Name <email>` trailer to the commit message. Reads `user.name` and `user.email` from the local git config. Skips silently if the trailer is already present.

```sh
# .husky/prepare-commit-msg
lazyconfig hook commit-signoff -f "$1"
```

Git passes the commit message file path as `$1` in the `prepare-commit-msg` hook. Always forward it with `-f` — the default path does not work correctly in git worktrees.

| Option      | Alias | Type      | Description                                                             |
| ----------- | ----- | --------- | ----------------------------------------------------------------------- |
| `--msgFile` | `-f`  | `string`  | Path to the commit message file. Defaults to `$GIT_DIR/COMMIT_EDITMSG`. |
| `--watch`   | `-w`  | `boolean` | Emit log messages during execution.                                     |

#### Examples

```sh
# Standard usage — forward the file path git provides
lazyconfig hook commit-signoff -f $1

# With verbose logging
lazyconfig hook commit-signoff -f $1 -w
```

---

## License

MIT
