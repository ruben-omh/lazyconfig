# @lazyconfig/presets

[![npm](https://img.shields.io/npm/v/@lazyconfig/presets?style=flat-square&logo=npm&logoColor=white&color=FFCA28)](https://www.npmjs.com/package/@lazyconfig/presets)
[![Downloads](https://img.shields.io/npm/dm/@lazyconfig/presets?style=flat-square&logo=npm&logoColor=white&label=downloads&color=8957E5)](https://www.npmjs.com/package/@lazyconfig/presets)
[![License](https://img.shields.io/npm/l/@lazyconfig/presets?style=flat-square&color=blue)](LICENSE)
[![Sponsor](https://img.shields.io/github/sponsors/ruben-omh?style=flat-square&logo=githubsponsors&logoColor=white&color=EA4AAA&label=Sponsor)](https://github.com/sponsors/ruben-omh)

Single-install meta-package that bundles the full lazyconfig toolchain. Install once and get TypeScript, ESLint, Jest, Rollup, Prettier, Commitlint, and API Extractor configurations — all pre-configured and ready to use.

All presets are re-exported through `@lazyconfig/presets/*` subpath exports, so you only need this one package installed.

---

## Installation

```sh
# pnpm
pnpm add -D @lazyconfig/presets

# npm
npm install --save-dev @lazyconfig/presets

# yarn
yarn add --dev @lazyconfig/presets

# bun
bun add --dev @lazyconfig/presets
```

---

## Included presets

| Subpath export                                                         | Description                 |
| ---------------------------------------------------------------------- | --------------------------- |
| [`@lazyconfig/presets/tsconfig/*`](#lazyconfigpresetstsconfig)         | TypeScript compiler presets |
| [`@lazyconfig/presets/eslint`](#lazyconfigpresetseslint)               | ESLint flat config factory  |
| [`@lazyconfig/presets/jest`](#lazyconfigpresetsjest)                   | Jest config factory         |
| [`@lazyconfig/presets/rollup`](#lazyconfigpresetsrollup)               | Rollup config factory       |
| [`@lazyconfig/presets/prettier`](#lazyconfigpresetsprettier)           | Prettier preset             |
| [`@lazyconfig/presets/commitlint`](#lazyconfigpresetscommitlint)       | Commitlint config           |
| [`@lazyconfig/presets/api-extractor`](#lazyconfigpresetsapi-extractor) | API Extractor base config   |

---

## `@lazyconfig/presets/tsconfig/*`

Reusable TypeScript compiler presets. Extend the preset that matches your project type.

### Requirements

No peer dependencies.

| Tool         | Version | Notes                              |
| ------------ | ------- | ---------------------------------- |
| `typescript` | `>=5.0` | Must be installed in your project  |
| Node.js      | `>=18`  | Required by the `node` preset only |

### Presets

| Preset  | Path                                 | Use case                           |
| ------- | ------------------------------------ | ---------------------------------- |
| `base`  | `@lazyconfig/presets/tsconfig/base`  | Foundation for all other presets   |
| `node`  | `@lazyconfig/presets/tsconfig/node`  | Node.js applications and CLI tools |
| `lib`   | `@lazyconfig/presets/tsconfig/lib`   | Framework-agnostic libraries       |
| `react` | `@lazyconfig/presets/tsconfig/react` | React applications                 |

### Usage

```json
// tsconfig.json — Node.js application
{
	"extends": "@lazyconfig/presets/tsconfig/node",
	"compilerOptions": {
		"outDir": "dist",
		"rootDir": "src"
	},
	"include": ["src"]
}
```

```json
// tsconfig.json — library consumed by bundlers
{
	"extends": "@lazyconfig/presets/tsconfig/lib",
	"compilerOptions": {
		"outDir": "out-tsc",
		"rootDir": "src"
	},
	"include": ["src"]
}
```

```json
// tsconfig.json — React application
{
	"extends": "@lazyconfig/presets/tsconfig/react",
	"include": ["src"]
}
```

#### Build-time constants (`env`)

Provides ambient types for `__DEV__` and `__PROD__` constants injected by bundlers:

```json
{
	"compilerOptions": {
		"types": ["@lazyconfig/presets/tsconfig/env"]
	}
}
```

---

## `@lazyconfig/presets/eslint`

ESLint flat config factory with opt-in presets for TypeScript, React, accessibility, Node.js, and Prettier.

### Requirements

| Package                     | Version | Required | Enables                                                                  |
| --------------------------- | ------- | -------- | ------------------------------------------------------------------------ |
| `eslint`                    | `^10`   | **Yes**  | Core ESLint engine                                                       |
| `@eslint/js`                | `^10`   | **Yes**  | Built-in ESLint rules                                                    |
| `typescript-eslint`         | `^8`    | Optional | TypeScript-aware rules (`typescript: true`)                              |
| `globals`                   | `^17`   | Optional | Global variable definitions (`typescript: true`)                         |
| `eslint-plugin-react`       | `^7`    | Optional | React rules (`react: true`)                                              |
| `eslint-plugin-react-hooks` | `^5`    | Optional | React hooks rules (`react: true`)                                        |
| `eslint-plugin-jsx-a11y`    | `^6`    | Optional | Accessibility rules (`a11y: true`)                                       |
| `eslint-plugin-n`           | `^18`   | Optional | Node.js rules (`node: true`)                                             |
| `eslint-config-prettier`    | `^10`   | Optional | Disables formatting rules that conflict with Prettier (`prettier: true`) |

Install only what you plan to use:

```sh
# required
pnpm add -D eslint @eslint/js

# TypeScript support
pnpm add -D typescript-eslint globals

# React support
pnpm add -D eslint-plugin-react eslint-plugin-react-hooks

# accessibility support
pnpm add -D eslint-plugin-jsx-a11y

# Node.js support
pnpm add -D eslint-plugin-n globals

# Prettier conflict resolution
pnpm add -D eslint-config-prettier
```

### Usage

```ts
// eslint.config.ts
import { defineConfig } from "@lazyconfig/presets/eslint";

export default defineConfig({
	typescript: true,
	node: true,
	prettier: true,
});
```

```ts
// with React and accessibility
import { defineConfig } from "@lazyconfig/presets/eslint";

export default defineConfig({
	typescript: true,
	react: true,
	a11y: true,
	prettier: true,
});
```

---

## `@lazyconfig/presets/jest`

Jest config factory with opt-in TypeScript (SWC), browser environment, coverage, and JUnit reporting.

### Requirements

| Package                  | Version | Required | Enables                                        |
| ------------------------ | ------- | -------- | ---------------------------------------------- |
| `jest`                   | `^30`   | **Yes**  | Core test runner                               |
| `@swc/core`              | `^1`    | Optional | TypeScript transformation (`typescript: true`) |
| `@swc/jest`              | `^0.2`  | Optional | SWC Jest transform (`typescript: true`)        |
| `jest-environment-jsdom` | `^30`   | Optional | Browser environment (`browser: true`)          |
| `jest-junit`             | `^17`   | Optional | JUnit XML reporting (`junit: true`)            |

Install only what you plan to use:

```sh
# required
pnpm add -D jest

# TypeScript transformation (recommended)
pnpm add -D @swc/core @swc/jest

# browser environment
pnpm add -D jest-environment-jsdom

# JUnit XML reporting
pnpm add -D jest-junit
```

### Usage

```js
// jest.config.js
import { defineConfig } from "@lazyconfig/presets/jest";

export default defineConfig({
	typescript: true,
	coverage: true,
	junit: {
		outputDirectory: "reports/unit",
		outputName: "test-results.xml",
		suiteName: "My test suite",
	},
});
```

---

## `@lazyconfig/presets/rollup`

Declarative, format-aware Rollup config factory with opt-in pre-configured plugins.

### Requirements

| Package                       | Version   | Required | Enables                                              |
| ----------------------------- | --------- | -------- | ---------------------------------------------------- |
| `rollup`                      | `^4.0.0`  | **Yes**  | Core bundler                                         |
| `@rollup/plugin-node-resolve` | `^16.0.0` | Optional | `plugins.node` — resolves bare module specifiers     |
| `@rollup/plugin-babel`        | `^7.0.0`  | Optional | `plugins.babel` — Babel transpilation                |
| `@rollup/plugin-json`         | `^6.0.0`  | Optional | `plugins.json` — JSON file imports                   |
| `@rollup/plugin-replace`      | `^6.0.0`  | Optional | `plugins.replace` — string replacement at build time |
| `@rollup/plugin-terser`       | `^1.0.0`  | Optional | `plugins.terser` — output minification               |

Install only what you plan to use:

```sh
# required
pnpm add -D rollup

# node resolution and Babel transpilation
pnpm add -D @rollup/plugin-node-resolve @rollup/plugin-babel

# JSON imports
pnpm add -D @rollup/plugin-json

# string replacement and minification
pnpm add -D @rollup/plugin-replace @rollup/plugin-terser
```

### Usage

```ts
// rollup.config.ts
import { defineConfig } from "@lazyconfig/presets/rollup";

export default defineConfig({
	bundles: [{ input: "src/index.ts", file: "my-lib", name: "MyLib" }],
	external: ["react"],
	plugins: { node: true, babel: true },
	formats: { es: true, cjs: true },
});
```

---

## `@lazyconfig/presets/prettier`

Shared Prettier preset for consistent code formatting.

### Requirements

No peer dependencies.

| Tool       | Version | Notes                             |
| ---------- | ------- | --------------------------------- |
| `prettier` | `^3`    | Must be installed in your project |

```sh
pnpm add -D prettier
```

### Usage

```json
// .prettierrc.json
"@lazyconfig/presets/prettier"
```

---

## `@lazyconfig/presets/commitlint`

Commitlint configuration enforcing [Conventional Commits](https://www.conventionalcommits.org/).

### Requirements

No peer dependencies.

| Tool                              | Version | Notes                             |
| --------------------------------- | ------- | --------------------------------- |
| `@commitlint/cli`                 | `^20`   | Must be installed in your project |
| `@commitlint/config-conventional` | `^20`   | Must be installed in your project |

```sh
pnpm add -D @commitlint/cli @commitlint/config-conventional
```

### Usage

```js
// commitlint.config.cjs
module.exports = {
	extends: ["@lazyconfig/presets/commitlint"],
};
```

---

## `@lazyconfig/presets/api-extractor`

Shared API Extractor base configuration for generating rolled-up `.d.ts` declaration files.

### Requirements

No peer dependencies.

| Tool                       | Version   | Notes                             |
| -------------------------- | --------- | --------------------------------- |
| `@microsoft/api-extractor` | `>=7.0.0` | Must be installed in your project |

```sh
pnpm add -D @microsoft/api-extractor
```

### Usage

```json
// api-extractor.json
{
	"$schema": "https://developer.microsoft.com/json-schemas/api-extractor/v7/api-extractor.schema.json",
	"extends": "@lazyconfig/presets/src/api-extractor.json",
	"mainEntryPointFilePath": "<projectFolder>/out-tsc/src/index.d.ts",
	"dtsRollup": {
		"enabled": true,
		"untrimmedFilePath": "<projectFolder>/dist/<unscopedPackageName>.index.d.ts"
	}
}
```

---

## License

MIT
