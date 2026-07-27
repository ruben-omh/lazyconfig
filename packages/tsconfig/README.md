# @lazyconfig/tsconfig

[![npm](https://img.shields.io/npm/v/@lazyconfig/tsconfig?style=flat-square&logo=npm&logoColor=white&color=FFCA28)](https://www.npmjs.com/package/@lazyconfig/tsconfig)
[![Downloads](https://img.shields.io/npm/dm/@lazyconfig/tsconfig?style=flat-square&logo=npm&logoColor=white&label=downloads&color=8957E5)](https://www.npmjs.com/package/@lazyconfig/tsconfig)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/npm/l/@lazyconfig/tsconfig?style=flat-square&color=blue)](LICENSE)
[![Sponsor](https://img.shields.io/github/sponsors/ruben-omh?style=flat-square&logo=githubsponsors&logoColor=white&color=EA4AAA&label=Sponsor)](https://github.com/sponsors/ruben-omh)

Reusable TypeScript configuration presets to standardize compiler settings across projects.

---

## Installation

```sh
# pnpm
pnpm add -D @lazyconfig/tsconfig typescript

# npm
npm install --save-dev @lazyconfig/tsconfig typescript

# yarn
yarn add --dev @lazyconfig/tsconfig typescript

# bun
bun add --dev @lazyconfig/tsconfig typescript
```

---

## Requirements

| Preset  | TypeScript | Node.js |
| ------- | ---------- | ------- |
| `base`  | `>=5.0`    | any     |
| `node`  | `>=5.0`    | `>=18`  |
| `lib`   | `>=5.0`    | any     |
| `react` | `>=5.0`    | any     |

- **TypeScript `>=5.0`** is required by all presets — `verbatimModuleSyntax` (base) and `moduleResolution: "Bundler"` (lib, react) were introduced in TS 5.0.
- **Node.js `>=18`** is required by the `node` preset — `target: "ES2022"` with `NodeNext` resolution targets the Node.js 18+ runtime.

---

## Presets

### `base` (default)

Foundation shared by all other presets. Enables strict type checking and common safety flags.

```json
{
	"extends": "@lazyconfig/tsconfig/base"
}
```

or explicitly:

```json
{
	"extends": "@lazyconfig/tsconfig/base.json"
}
```

| Option                             | Value  |
| ---------------------------------- | ------ |
| `strict`                           | `true` |
| `skipLibCheck`                     | `true` |
| `forceConsistentCasingInFileNames` | `true` |
| `esModuleInterop`                  | `true` |
| `verbatimModuleSyntax`             | `true` |

> `verbatimModuleSyntax` enforces that type-only imports use `import type`, ensuring safe erasure by single-file transpilers such as Vite, esbuild, and SWC.

---

### `node`

For Node.js applications and CLI tools. Uses `NodeNext` module resolution with source maps and declaration output enabled.

```json
{
	"extends": "@lazyconfig/tsconfig/node",
	"compilerOptions": {
		"outDir": "dist",
		"rootDir": "src"
	},
	"include": ["src"]
}
```

| Option             | Value        |
| ------------------ | ------------ |
| `target`           | `ES2022`     |
| `lib`              | `["ES2022"]` |
| `module`           | `NodeNext`   |
| `moduleResolution` | `NodeNext`   |
| `declaration`      | `true`       |
| `declarationMap`   | `true`       |
| `sourceMap`        | `true`       |
| `noEmitOnError`    | `true`       |

> `NodeNext` module resolution requires file extensions in relative imports (e.g. `import { foo } from './foo.js'`).

---

### `lib`

For framework-agnostic libraries consumed by bundlers. Emits only declaration files — the bundler handles the JavaScript output.

```json
{
	"extends": "@lazyconfig/tsconfig/lib",
	"compilerOptions": {
		"outDir": "dist",
		"rootDir": "src"
	},
	"include": ["src"]
}
```

| Option                | Value        |
| --------------------- | ------------ |
| `target`              | `ES2022`     |
| `lib`                 | `["ES2022"]` |
| `module`              | `ESNext`     |
| `moduleResolution`    | `Bundler`    |
| `declaration`         | `true`       |
| `declarationMap`      | `true`       |
| `emitDeclarationOnly` | `true`       |
| `noEmitOnError`       | `true`       |

---

### `react`

For React applications. Adds DOM types and enables the automatic JSX transform. Delegates all emit to the bundler.

```json
{
	"extends": "@lazyconfig/tsconfig/react",
	"compilerOptions": {
		"baseUrl": ".",
		"paths": {
			"@/*": ["src/*"]
		}
	},
	"include": ["src"]
}
```

| Option             | Value                               |
| ------------------ | ----------------------------------- |
| `target`           | `ES2022`                            |
| `lib`              | `["DOM", "DOM.Iterable", "ES2022"]` |
| `module`           | `ESNext`                            |
| `moduleResolution` | `Bundler`                           |
| `jsx`              | `react-jsx`                         |
| `noEmit`           | `true`                              |

> `DOM.Iterable` is included so `for...of` over DOM collections (`NodeList`, `HTMLCollection`, etc.) type-checks correctly.

> Path aliases (e.g. `@/`) require `baseUrl` and `paths` in your project's own `tsconfig.json`. The bundler also needs its own alias configuration (e.g. `resolve.alias` in Vite).

---

## `env.d.ts` — build-time constants

Provides ambient type declarations for constants injected by bundlers at build time.

```json
{
	"compilerOptions": {
		"types": ["@lazyconfig/tsconfig/env"]
	}
}
```

| Constant   | Type      | Description                                         |
| ---------- | --------- | --------------------------------------------------- |
| `__DEV__`  | `boolean` | `true` in development builds, `false` in production |
| `__PROD__` | `boolean` | `true` in production builds, `false` in development |

---

## License

MIT
