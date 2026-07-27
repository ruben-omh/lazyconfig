# lazyconfig

[![CI](https://img.shields.io/github/actions/workflow/status/ruben-omh/lazyconfig/ci.yml?branch=main&style=flat-square&logo=githubactions&logoColor=white&label=CI)](https://github.com/ruben-omh/lazyconfig/actions/workflows/ci.yml)
[![Codecov](https://img.shields.io/codecov/c/github/ruben-omh/lazyconfig?style=flat-square&logo=codecov&logoColor=white)](https://codecov.io/gh/ruben-omh/lazyconfig)
[![License](https://img.shields.io/github/license/ruben-omh/lazyconfig?style=flat-square&color=blue)](LICENSE)
[![Changesets](https://img.shields.io/badge/maintained_with-changesets-176de3?style=flat-square&logo=changesets&logoColor=white)](https://github.com/changesets/changesets)
[![Conventional Commits](https://img.shields.io/badge/conventional_commits-1.0.0-FE5196?style=flat-square&logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)
[![Node](https://img.shields.io/badge/node-%3E%3D22-5FA04E?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-%3E%3D11-F69220?style=flat-square&logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Sponsor](https://img.shields.io/github/sponsors/ruben-omh?style=flat-square&logo=githubsponsors&logoColor=white&color=EA4AAA&label=Sponsor)](https://github.com/sponsors/ruben-omh)

Shareable, composable configuration packages for JavaScript and TypeScript projects — covering ESLint, Jest, Rollup, TypeScript, Prettier, commitlint, and more.

---

## Packages

| Package                                               | Description                                                           |
| ----------------------------------------------------- | --------------------------------------------------------------------- |
| [`@lazyconfig/eslint`](packages/eslint)               | Composable ESLint flat config presets for JS, TS, React, and Node.js  |
| [`@lazyconfig/jest`](packages/jest)                   | Composable Jest presets for JS and TypeScript projects                |
| [`@lazyconfig/rollup`](packages/rollup)               | Declarative, format-aware Rollup configuration with opt-in plugins    |
| [`@lazyconfig/tsconfig`](packages/tsconfig)           | TypeScript configuration presets for libraries and Node.js apps       |
| [`@lazyconfig/prettier`](packages/prettier)           | Prettier preset for consistent code formatting                        |
| [`@lazyconfig/commitlint`](packages/commitlint)       | Commitlint configuration enforcing Conventional Commits               |
| [`@lazyconfig/api-extractor`](packages/api-extractor) | API Extractor base config for generating rolled-up `.d.ts` files      |
| [`@lazyconfig/cli`](packages/cli)                     | CLI scripts for automating development workflows                      |
| [`@lazyconfig/presets`](packages/presets)             | Meta-package that bundles all lazyconfig packages in a single install |

---

## Quick Start

Install individual packages or use the meta-package for everything at once.

**All-in-one:**

```sh
pnpm add -D @lazyconfig/presets
```

**Individual packages:**

```sh
pnpm add -D @lazyconfig/eslint @lazyconfig/jest @lazyconfig/tsconfig
```

---

## Usage

### ESLint

`base` is always included. All other presets are opt-in boolean flags:

```js
// eslint.config.js
import { defineConfig } from "@lazyconfig/eslint";

// Base only
export default defineConfig();

// TypeScript project
export default defineConfig({ typescript: true });

// React + TypeScript + Prettier
export default defineConfig({ typescript: true, react: true, prettier: true });

// Node.js + TypeScript
export default defineConfig({ typescript: true, node: true });
```

Available presets: `typescript`, `react`, `a11y`, `node`, `prettier`, `ignores`.

See [`packages/eslint`](packages/eslint) for the full API.

---

### Jest

```js
// jest.config.js
import { defineConfig } from "@lazyconfig/jest";

export default defineConfig({
	typescript: true,
	coverage: true,
});
```

Supports TypeScript via SWC, jsdom for browser environments, coverage thresholds, JUnit XML output, and path aliases.

See [`packages/jest`](packages/jest) for the full API.

---

### Rollup

```js
// rollup.config.js
import { defineConfig } from "@lazyconfig/rollup";

export default defineConfig({
	bundles: [{ input: "src/index.ts", file: "my-lib" }],
	formats: { es: true, cjs: true },
	plugins: { node: true },
});
```

Supports ES, CJS, UMD, IIFE, AMD, and System output formats with opt-in plugins (node-resolve, Babel, JSON, replace, Terser, and custom extras).

See [`packages/rollup`](packages/rollup) for the full API.

---

### TypeScript

```json
// tsconfig.json
{ "extends": "@lazyconfig/tsconfig/lib" }
```

Available presets: `base`, `node`, `lib`, `react`. Includes an `env.d.ts` for `__DEV__` and `__PROD__` globals.

See [`packages/tsconfig`](packages/tsconfig) for the full API.

---

### Prettier

```json
// .prettierrc.json
"@lazyconfig/prettier"
```

See [`packages/prettier`](packages/prettier) for the full options table.

---

### commitlint

```js
// commitlint.config.cjs
module.exports = {
	extends: ["@lazyconfig/commitlint"],
};
```

For ESM projects (`"type": "module"`), use `.commitlintrc.mjs` instead:

```js
// .commitlintrc.mjs
export default {
	extends: ["@lazyconfig/commitlint"],
};
```

Enforces [Conventional Commits](https://www.conventionalcommits.org/) with 11 commit types. Integrate with Husky to validate messages locally via the `commit-msg` hook.

See [`packages/commitlint`](packages/commitlint) for the full rules table.

---

### API Extractor

```json
// api-extractor.json
{ "extends": "@lazyconfig/api-extractor/base.json" }
```

See [`packages/api-extractor`](packages/api-extractor) for defaults and overrides.

---

### CLI

```sh
# Compile TypeScript declarations (tsc + api-extractor)
lazyconfig compile types

# Enforce commit sign-off in a Git hook
lazyconfig hook commit-signoff
```

See [`packages/cli`](packages/cli) for all commands.

---

## Development

**Requirements:** Node.js ≥ 22, pnpm ≥ 10

```sh
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run all tests
pnpm test

# Lint
pnpm lint

# Type-check
pnpm typecheck
```

---

## Troubleshooting

### Deprecated `glob` / `inflight` warning on install

When installing `@lazyconfig/*` packages in your project, pnpm may report:

```
[WARN] deprecated subdependencies found: glob@7.2.3, inflight@1.0.6
```

These come from `jest`'s internal coverage path (`babel-plugin-istanbul` → `test-exclude` → `glob@7`). They're transitive and harmless, but if you want a clean install, add the following override to your **own** project's `pnpm-workspace.yaml` (or to `pnpm.overrides` in `package.json` for non-monorepo projects):

```yaml
overrides:
  "glob@<10": "^10"
allowedDeprecatedVersions:
  glob: "*"
```

The override is **project-local** and is not propagated from this repository's lockfile — every consuming project must declare it independently.

### `ERR_PNPM_IGNORED_BUILDS: unrs-resolver`

pnpm 10+ no longer auto-runs install scripts for security. `unrs-resolver` (pulled in by some ESLint resolver plugins) ships native binaries and needs its build script to run. Approve it once with:

```sh
pnpm approve-builds
```

Or add it permanently to your `pnpm-workspace.yaml`:

```yaml
allowBuilds:
  unrs-resolver: true
```

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before opening a pull request.

All commits must follow [Conventional Commits](https://www.conventionalcommits.org/) and include a [DCO](https://developercertificate.org/) `Signed-off-by` trailer (`git commit -s`).

---

## License

[MIT](LICENSE) © [ruben-omh](https://github.com/ruben-omh)
