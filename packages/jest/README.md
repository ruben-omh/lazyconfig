# @lazyconfig/jest

[![npm](https://img.shields.io/npm/v/@lazyconfig/jest?style=flat-square&logo=npm&logoColor=white&color=FFCA28)](https://www.npmjs.com/package/@lazyconfig/jest)
[![Downloads](https://img.shields.io/npm/dm/@lazyconfig/jest?style=flat-square&logo=npm&logoColor=white&label=downloads&color=8957E5)](https://www.npmjs.com/package/@lazyconfig/jest)
[![Coverage](https://img.shields.io/codecov/c/github/ruben-omh/lazyconfig?flag=jest&style=flat-square&logo=codecov&logoColor=white&label=coverage)](https://app.codecov.io/gh/ruben-omh/lazyconfig/flags?flag=jest)
[![Jest](https://img.shields.io/badge/Jest-30-C21325?style=flat-square&logo=jest&logoColor=white)](https://jestjs.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/npm/l/@lazyconfig/jest?style=flat-square&color=blue)](LICENSE)
[![Sponsor](https://img.shields.io/github/sponsors/ruben-omh?style=flat-square&logo=githubsponsors&logoColor=white&color=EA4AAA&label=Sponsor)](https://github.com/sponsors/ruben-omh)

Reusable, composable Jest configuration presets for JavaScript and TypeScript projects.

Provides a `defineConfig` helper that assembles a sensible Jest configuration from opt-in feature flags. Works with plain JavaScript by default — TypeScript, browser environment, coverage, JUnit reporting, and path aliases are all opt-in.

---

## Requirements

- Jest `^30`
- Node.js `>=22.0.0`

---

## Installation

```sh
# pnpm
pnpm add -D jest @lazyconfig/jest

# npm
npm install --save-dev jest @lazyconfig/jest

# yarn
yarn add --dev jest @lazyconfig/jest

# bun
bun add --dev jest @lazyconfig/jest
```

Each feature has additional peer dependencies. Install only what you use:

| Feature            | Additional peer dependencies |
| ------------------ | ---------------------------- |
| `typescript: true` | `@swc/jest`, `@swc/core`     |
| `browser: true`    | `jest-environment-jsdom`     |
| `junit: true`      | `jest-junit`                 |

---

## Usage

### Basic — JavaScript

```js
// jest.config.js
import { defineConfig } from "@lazyconfig/jest";

export default defineConfig();
```

### TypeScript

```sh
pnpm add -D @swc/jest @swc/core
```

```ts
// jest.config.ts
import { defineConfig } from "@lazyconfig/jest";

export default defineConfig({
	typescript: true,
});
```

TypeScript files are transformed to CommonJS by `@swc/jest`, targeting ES2022. This means no `--experimental-vm-modules` flag is required and tests run in a stable Jest environment regardless of your project's module format.

### Browser environment (jsdom)

```sh
pnpm add -D jest-environment-jsdom
```

```ts
import { defineConfig } from "@lazyconfig/jest";

export default defineConfig({
	typescript: true,
	browser: true,
});
```

### Coverage

Enable with `true` for default settings, or pass an object to enforce per-metric thresholds:

```ts
import { defineConfig } from "@lazyconfig/jest";

// Collect coverage, no thresholds
export default defineConfig({
	coverage: true,
});

// Collect coverage with thresholds
export default defineConfig({
	coverage: {
		lines: 80,
		branches: 75,
		functions: 80,
		statements: 80,
	},
});
```

When coverage is enabled, the following source patterns are collected and test/index/type files are excluded automatically:

| Pattern                                | Effect                            |
| -------------------------------------- | --------------------------------- |
| `src/**/*.[jt]s?(x)`                   | Collects from all source files    |
| `!src/index.*`, `!src/**/index.*`      | Excludes barrel files             |
| `!src/**/types.*`                      | Excludes type-only files          |
| `!src/**/__tests__/**`                 | Excludes test directories         |
| `!src/**/?(*.)+(spec\|test).[jt]s?(x)` | Excludes test files               |
| `!test/**/*`                           | Excludes top-level test directory |

### JUnit XML reporter

Useful for CI pipelines that consume JUnit XML reports (GitHub Actions, GitLab CI, Jenkins, etc.).

```sh
pnpm add -D jest-junit
```

```ts
import { defineConfig } from "@lazyconfig/jest";

// Enable with defaults — writes junit.xml in the current directory
export default defineConfig({
	junit: true,
});

// Customize output
export default defineConfig({
	junit: {
		outputDirectory: "reports",
		outputName: "test-results.xml",
		suiteName: "My App",
	},
});
```

The `default` reporter is always kept alongside `jest-junit` so terminal output is not lost.

### Path aliases

Maps directly to Jest's `moduleNameMapper`:

```ts
import { defineConfig } from "@lazyconfig/jest";

export default defineConfig({
	typescript: true,
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/src/$1",
	},
});
```

When `typescript: true`, a `'^(\\.{1,2}/.*)\\.js$': '$1'` entry is added automatically. This strips `.js` extensions from relative imports so Jest can resolve TypeScript source files when import paths use the `.js` convention. User-provided entries are merged on top and take precedence.

### Custom overrides

Use `extends` to merge additional Jest config. Keys in this object take precedence over the generated config:

```ts
import { defineConfig } from "@lazyconfig/jest";

export default defineConfig({
	typescript: true,
	extends: {
		testTimeout: 10000,
		setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
	},
});
```

---

## Defaults

The following values are always set regardless of options:

| Setting                  | Value                                | Reason                                                     |
| ------------------------ | ------------------------------------ | ---------------------------------------------------------- |
| `verbose`                | `true`                               | Shows individual test results in the terminal              |
| `testEnvironment`        | `'node'`                             | Safe default; opt into `'jsdom'` via `browser: true`       |
| `testPathIgnorePatterns` | `node_modules/`, `dist/`, `out-tsc/` | Prevents discovering compiled test files from build output |

---

## API

```ts
import {
	defineConfig,
	type JestConfig,
	type DefineConfigOptions,
	type CoverageThresholds,
	type JunitOptions,
} from "@lazyconfig/jest";
```

### `defineConfig(options?)`

Builds and returns a `JestConfig` object.

```ts
defineConfig(options?: DefineConfigOptions): JestConfig
```

### `DefineConfigOptions`

| Option             | Type                            | Default | Description                                             |
| ------------------ | ------------------------------- | ------- | ------------------------------------------------------- |
| `typescript`       | `boolean`                       | `false` | Enables TypeScript transformation via `@swc/jest`       |
| `browser`          | `boolean`                       | `false` | Sets `testEnvironment` to `'jsdom'`                     |
| `coverage`         | `boolean \| CoverageThresholds` | `false` | Enables coverage collection, optionally with thresholds |
| `junit`            | `boolean \| JunitOptions`       | `false` | Enables JUnit XML reporter via `jest-junit`             |
| `moduleNameMapper` | `Record<string, string>`        | —       | Path alias mappings                                     |
| `extends`          | `JestConfig`                    | —       | Additional config merged last (takes precedence)        |

### `CoverageThresholds`

| Field        | Type     | Description                                   |
| ------------ | -------- | --------------------------------------------- |
| `lines`      | `number` | Minimum line coverage percentage (0–100)      |
| `branches`   | `number` | Minimum branch coverage percentage (0–100)    |
| `functions`  | `number` | Minimum function coverage percentage (0–100)  |
| `statements` | `number` | Minimum statement coverage percentage (0–100) |

### `JunitOptions`

| Field               | Type     | Default        | Description                                           |
| ------------------- | -------- | -------------- | ----------------------------------------------------- |
| `outputDirectory`   | `string` | `'.'`          | Directory to write the XML report to                  |
| `outputName`        | `string` | `'junit.xml'`  | XML report filename                                   |
| `suiteName`         | `string` | `'jest tests'` | Name of the root `<testsuites>` element               |
| `ancestorSeparator` | `string` | `' > '`        | Separator between ancestor suite names in `classname` |

---

## License

MIT
