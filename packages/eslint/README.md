# @lazyconfig/eslint

[![npm](https://img.shields.io/npm/v/@lazyconfig/eslint?style=flat-square&logo=npm&logoColor=white&color=FFCA28)](https://www.npmjs.com/package/@lazyconfig/eslint)
[![Downloads](https://img.shields.io/npm/dm/@lazyconfig/eslint?style=flat-square&logo=npm&logoColor=white&label=downloads&color=8957E5)](https://www.npmjs.com/package/@lazyconfig/eslint)
[![Coverage](https://img.shields.io/codecov/c/github/ruben-omh/lazyconfig?flag=eslint&style=flat-square&logo=codecov&logoColor=white&label=coverage)](https://app.codecov.io/gh/ruben-omh/lazyconfig/flags?flag=eslint)
[![ESLint](https://img.shields.io/badge/ESLint-10-4B32C3?style=flat-square&logo=eslint&logoColor=white)](https://eslint.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/npm/l/@lazyconfig/eslint?style=flat-square&color=blue)](LICENSE)
[![Sponsor](https://img.shields.io/github/sponsors/ruben-omh?style=flat-square&logo=githubsponsors&logoColor=white&color=EA4AAA&label=Sponsor)](https://github.com/sponsors/ruben-omh)

Reusable, composable ESLint flat config presets for JavaScript, TypeScript, React, and Node.js projects.

Provides a `defineConfig` helper and individual presets built on ESLint 10's flat config format. The `base` preset is always included — all others are opt-in.

---

## Requirements

- ESLint `^10`
- `@eslint/js` `^10`
- Node.js `>=22.0.0`

---

## Installation

The following packages are required by all presets and must always be installed:

```sh
# pnpm
pnpm add -D eslint @eslint/js @lazyconfig/eslint

# npm
npm install --save-dev eslint @eslint/js @lazyconfig/eslint

# yarn
yarn add --dev eslint @eslint/js @lazyconfig/eslint

# bun
bun add --dev eslint @eslint/js @lazyconfig/eslint
```

Each preset has additional peer dependencies. Install only what you use:

| Preset       | Additional peer dependencies                                  |
| ------------ | ------------------------------------------------------------- |
| `base`       | _(none)_                                                      |
| `ignores`    | _(none)_                                                      |
| `typescript` | `typescript-eslint`                                           |
| `react`      | `eslint-plugin-react`, `eslint-plugin-react-hooks`, `globals` |
| `a11y`       | `eslint-plugin-jsx-a11y`                                      |
| `node`       | `eslint-plugin-n`, `globals`                                  |
| `prettier`   | `eslint-config-prettier`                                      |

---

## Migrating from v1

**v2 converts peer-dependent presets into factory functions.** This affects raw-preset users only — `defineConfig` consumers need no code changes.

```diff
  // eslint.config.js
  import { base, typescript, react, node, a11y, prettier } from "@lazyconfig/eslint";

  export default [
-   ...base, ...typescript, ...react, ...node, ...a11y, ...prettier,
+   ...base, ...typescript(), ...react(), ...node(), ...a11y(), ...prettier(),
  ];
```

`base` and `ignores` remain plain arrays (no peers to load). `typescript`, `react`, `a11y`, `node`, and `prettier` are now `() => Linter.Config[]` factories.

**Why:** missing peer dependencies now throw at preset activation with an actionable `pnpm add -D <pkg>` hint, instead of silently producing an empty rule set.

---

## Usage

### `defineConfig` — recommended

The easiest way to get started. Pass the presets you want as boolean flags — `base` is always included.

```js
// eslint.config.js
import { defineConfig } from "@lazyconfig/eslint";

export default defineConfig();
```

#### TypeScript project

```sh
pnpm add -D typescript-eslint
```

```js
import { defineConfig } from "@lazyconfig/eslint";

export default defineConfig({
	typescript: true,
});
```

#### React + TypeScript project

```sh
pnpm add -D typescript-eslint eslint-plugin-react eslint-plugin-react-hooks globals
```

> `globals` is required by the `react` preset for browser globals (`window`, `document`, etc.).

```js
import { defineConfig } from "@lazyconfig/eslint";

export default defineConfig({
	typescript: true,
	react: true,
});
```

#### React + TypeScript + Accessibility

```sh
pnpm add -D typescript-eslint eslint-plugin-react eslint-plugin-react-hooks globals eslint-plugin-jsx-a11y
```

> `globals` is required by the `react` preset for browser globals (`window`, `document`, etc.).

```js
import { defineConfig } from "@lazyconfig/eslint";

export default defineConfig({
	typescript: true,
	react: true,
	a11y: true,
});
```

#### Node.js + TypeScript project

```sh
pnpm add -D typescript-eslint eslint-plugin-n globals
```

> `globals` is required by the `node` preset for Node.js globals (`process`, `Buffer`, etc.).

```js
import { defineConfig } from "@lazyconfig/eslint";

export default defineConfig({
	typescript: true,
	node: true,
});
```

#### With Prettier integration

```sh
pnpm add -D eslint-config-prettier
```

```js
import { defineConfig } from "@lazyconfig/eslint";

export default defineConfig({
	typescript: true,
	react: true,
	prettier: true, // always applied last
});
```

#### With ignore patterns

Use `ignores: true` to apply the default ignore patterns, or pass an array to extend them with additional patterns.

```js
import { defineConfig } from '@lazyconfig/eslint';

// Use defaults
export default defineConfig({
  typescript: true,
  ignores: true,
});

// Extend defaults with additional patterns
export default defineConfig({
  typescript: true,
  ignores: ['**/.next/**', '**/storybook-static/**'],
});
```

Default ignored paths:

| Pattern                                                   | Targets                |
| --------------------------------------------------------- | ---------------------- |
| `**/dist/**`, `**/build/**`, `**/out/**`, `**/out-tsc/**` | Build artifacts        |
| `**/coverage/**`                                          | Test coverage output   |
| `**/node_modules/**`                                      | Dependencies           |
| `**/.next/**`, `**/.nuxt/**`, `**/.output/**`             | Framework build output |

---

#### With custom rule overrides

Use the `extends` option to add project-specific rules on top of the presets. Custom overrides are applied after all presets but before `prettier`.

```js
import { defineConfig } from "@lazyconfig/eslint";

export default defineConfig({
	typescript: true,
	react: true,
	prettier: true,
	extends: [
		{
			rules: {
				"no-console": "off",
				"@typescript-eslint/explicit-function-return-type": "off",
			},
		},
		{
			files: ["**/*.test.ts"],
			rules: {
				"@typescript-eslint/no-explicit-any": "off",
			},
		},
	],
});
```

---

### Raw presets — advanced

If you need full control over the config array, import presets directly and compose them manually.

```js
// eslint.config.js
import { ignores, base, typescript, react, prettier } from "@lazyconfig/eslint";

export default [
	...ignores, // always first
	...base,
	...typescript(),
	...react(),
	...prettier(), // always last
];
```

> When composing manually, always place `ignores` first and `prettier()` last.
>
> Each peer-dependent preset (`typescript`, `react`, `a11y`, `node`, `prettier`) is a **factory function** — call it (`typescript()`) to materialise its config array. Missing peer dependencies throw immediately at call time with an actionable `pnpm add -D <pkg>` hint, rather than silently producing an empty config.

---

## Presets

### `ignores`

Excludes common build artifacts, dependencies, and generated files from linting. Applied before all other presets when enabled.

**Opt-in** — enable via `ignores: true` in `defineConfig`, or compose manually by placing `...ignores` first.

> When extending with an array, default patterns are always included — you cannot accidentally drop them.

---

### `base`

Always included by `defineConfig`. Extends `eslint:recommended` with sensible defaults for modern JavaScript.

| Rule                | Severity | Description                                          |
| ------------------- | -------- | ---------------------------------------------------- |
| `no-console`        | warn     | Discourages leftover console statements              |
| `no-debugger`       | error    | Disallows `debugger` statements                      |
| `no-unused-vars`    | warn     | Flags unused variables (prefix with `_` to ignore)   |
| `no-shadow`         | error    | Disallows variable shadowing                         |
| `prefer-const`      | error    | Requires `const` when a variable is never reassigned |
| `no-var`            | error    | Disallows `var` — use `let` or `const`               |
| `prefer-template`   | warn     | Prefers template literals over string concatenation  |
| `dot-notation`      | error    | Enforces dot notation for property access            |
| `no-useless-return` | error    | Removes unnecessary `return` statements              |
| `no-else-return`    | error    | Removes unnecessary `else` after `return`            |

---

### `typescript`

Type-aware TypeScript rules via `typescript-eslint`. Requires a `tsconfig.json` in the project.

Replaces `no-unused-vars` and `no-shadow` with their TypeScript-aware equivalents.

| Rule                                               | Severity | Description                                  |
| -------------------------------------------------- | -------- | -------------------------------------------- |
| `@typescript-eslint/no-unused-vars`                | warn     | TypeScript-aware unused variable check       |
| `@typescript-eslint/no-shadow`                     | error    | TypeScript-aware variable shadowing check    |
| `@typescript-eslint/explicit-function-return-type` | warn     | Encourages explicit return types             |
| `@typescript-eslint/no-explicit-any`               | warn     | Discourages use of `any`                     |
| `@typescript-eslint/consistent-type-imports`       | error    | Enforces `import type` for type-only imports |
| `@typescript-eslint/no-floating-promises`          | error    | Disallows unhandled promise rejections       |
| `@typescript-eslint/await-thenable`                | error    | Disallows `await` on non-promise values      |
| `@typescript-eslint/require-await`                 | warn     | Warns on `async` functions with no `await`   |

---

### `react`

React and React Hooks rules. Assumes React 17+ with the automatic JSX transform — no need to import React in every file.

Registers `globals.browser` so `window`, `document`, `fetch`, and other browser globals are recognised.

| Rule                          | Severity | Description                                                |
| ----------------------------- | -------- | ---------------------------------------------------------- |
| `react/self-closing-comp`     | error    | Enforces self-closing tags for components without children |
| `react/no-array-index-key`    | warn     | Discourages array index as `key` prop                      |
| `react/display-name`          | warn     | Warns on missing component display names                   |
| `react/no-children-prop`      | error    | Disallows passing children as a prop                       |
| `react/react-in-jsx-scope`    | off      | Not needed with the automatic JSX transform                |
| `react-hooks/rules-of-hooks`  | error    | Enforces the Rules of Hooks                                |
| `react-hooks/exhaustive-deps` | warn     | Warns on missing hook dependencies                         |

---

### `a11y`

JSX accessibility rules via `eslint-plugin-jsx-a11y`. Enforces ARIA attributes, keyboard navigation, semantic HTML, and more.

**Opt-in** — intended to be used alongside the `react` preset.

```js
defineConfig({ react: true, a11y: true });
```

> Using `a11y: true` without `react: true` will log a warning.

---

### `node`

Node.js specific rules via `eslint-plugin-n`. Catches imports of unavailable built-in modules, deprecated APIs, and missing ESM file extensions.

Registers `globals.node` so `process`, `Buffer`, `__dirname`, and other Node.js globals are recognised.

| Rule                         | Severity | Description                                       |
| ---------------------------- | -------- | ------------------------------------------------- |
| `n/file-extension-in-import` | error    | Requires file extensions in ESM imports           |
| `n/no-deprecated-api`        | error    | Disallows deprecated Node.js APIs                 |
| `n/no-missing-import`        | warn     | Warns on imports not listed in `package.json`     |
| `n/no-process-exit`          | error    | Disallows `process.exit()` — throw errors instead |

---

### `prettier`

Disables all ESLint formatting rules that conflict with Prettier. Works with any Prettier configuration.

Always applied last by `defineConfig`. When composing manually, place `...prettier()` at the end of the config array.

---

## Programmatic API

```ts
import {
	defineConfig,
	ignores,
	DEFAULT_IGNORE_PATTERNS,
	base,
	typescript,
	react,
	a11y,
	node,
	prettier,
	type DefineConfigOptions,
} from "@lazyconfig/eslint";
```

| Export                    | Type                                                 | Description                                                 |
| ------------------------- | ---------------------------------------------------- | ----------------------------------------------------------- |
| `defineConfig`            | `(options?: DefineConfigOptions) => Linter.Config[]` | Builds a config array from selected presets                 |
| `ignores`                 | `Linter.Config[]`                                    | Default ignore patterns preset                              |
| `DEFAULT_IGNORE_PATTERNS` | `string[]`                                           | Raw array of default ignore patterns                        |
| `base`                    | `Linter.Config[]`                                    | Core JS preset                                              |
| `typescript`              | `() => Linter.Config[]`                              | TypeScript preset factory (throws if peer missing)          |
| `react`                   | `() => Linter.Config[]`                              | React preset factory (throws if peer missing)               |
| `a11y`                    | `() => Linter.Config[]`                              | Accessibility preset factory (throws if peer missing)       |
| `node`                    | `() => Linter.Config[]`                              | Node.js preset factory (throws if peer missing)             |
| `prettier`                | `() => Linter.Config[]`                              | Prettier conflict-disabler factory (throws if peer missing) |
| `DefineConfigOptions`     | `interface`                                          | Options type for `defineConfig`                             |

---

## License

MIT
