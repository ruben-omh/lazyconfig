# @lazyconfig/rollup

[![npm](https://img.shields.io/npm/v/@lazyconfig/rollup?style=flat-square&logo=npm&logoColor=white&color=FFCA28)](https://www.npmjs.com/package/@lazyconfig/rollup)
[![Downloads](https://img.shields.io/npm/dm/@lazyconfig/rollup?style=flat-square&logo=npm&logoColor=white&label=downloads&color=8957E5)](https://www.npmjs.com/package/@lazyconfig/rollup)
[![Coverage](https://img.shields.io/codecov/c/github/ruben-omh/lazyconfig?flag=rollup&style=flat-square&logo=codecov&logoColor=white&label=coverage)](https://app.codecov.io/gh/ruben-omh/lazyconfig/flags?flag=rollup)
[![Rollup](https://img.shields.io/badge/Rollup-4-EC4A3F?style=flat-square&logo=rollup.js&logoColor=white)](https://rollupjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/npm/l/@lazyconfig/rollup?style=flat-square&color=blue)](LICENSE)
[![Sponsor](https://img.shields.io/github/sponsors/ruben-omh?style=flat-square&logo=githubsponsors&logoColor=white&color=EA4AAA&label=Sponsor)](https://github.com/sponsors/ruben-omh)

Declarative, format-aware Rollup configuration with opt-in pre-configured plugins.

## Installation

```sh
npm install --save-dev @lazyconfig/rollup rollup
```

Plugins are optional peer dependencies — install only the ones you use:

```sh
npm install --save-dev @rollup/plugin-node-resolve @rollup/plugin-babel @rollup/plugin-json @rollup/plugin-replace @rollup/plugin-terser
```

## Usage

```ts
// rollup.config.ts
import { defineConfig } from "@lazyconfig/rollup";

export default defineConfig({
	bundles: [{ input: "src/index.ts", file: "my-lib", name: "MyLib" }],
});
```

By default only the `es` format is emitted. All options are described below.

## `defineConfig(options)`

Returns an array of `RollupOptions` — one entry per active bundle × format pair.

### `bundles` (required)

An array of bundle entries. Each entry is built independently.

| Field         | Type                              | Default    | Description                                                                           |
| ------------- | --------------------------------- | ---------- | ------------------------------------------------------------------------------------- |
| `input`       | `InputOption`                     | —          | Entry point(s) for this bundle.                                                       |
| `file`        | `string`                          | `'bundle'` | Base output file name without extension.                                              |
| `outputDir`   | `string`                          | `'dist'`   | Directory to write generated files to.                                                |
| `name`        | `string`                          | —          | Global variable name for UMD / IIFE formats. Required when those formats are enabled. |
| `sourcemap`   | `boolean \| 'inline' \| 'hidden'` | `false`    | Source map output mode.                                                               |
| `banner`      | `string \| () => string`          | —          | Prepended to each output file (e.g. license header).                                  |
| `footer`      | `string \| () => string`          | —          | Appended to each output file.                                                         |
| `omitFormats` | `SupportedFormat[]`               | —          | Formats to skip for this bundle only, overriding the shared `formats` config.         |

```ts
defineConfig({
	bundles: [
		{ input: "src/index.ts", file: "my-lib", name: "MyLib" },
		{ input: "src/cli.ts", file: "cli", omitFormats: ["es"] },
	],
	formats: { es: true, cjs: true },
});
```

### `formats`

Controls which output formats are emitted. Only `es` is enabled by default.

| Format   | Default extension | Default |
| -------- | ----------------- | ------- |
| `es`     | `.mjs`            | `true`  |
| `cjs`    | `.cjs`            | `false` |
| `umd`    | `.js`             | `false` |
| `iife`   | `.js`             | `false` |
| `amd`    | `.js`             | `false` |
| `system` | `.js`             | `false` |

Each format accepts:

- `false` — disabled
- `true` — enabled with defaults
- `FormatOutputOptions` — enabled with per-format overrides
- `FormatOutputOptions[]` — multiple outputs for the same format (e.g. dev + prod)

**`FormatOutputOptions`**

| Field      | Type                       | Description                                                                                                   |
| ---------- | -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `ext`      | `string`                   | Output file extension without the leading dot. Overrides the format default (e.g. `'js'` instead of `'mjs'`). |
| `globals`  | `GlobalsOption`            | Format-level globals merged on top of shared `globals`. Takes precedence over shared values.                  |
| `plugins`  | `PluginsOptions`           | Format-level plugin overrides merged on top of shared `plugins`.                                              |
| `external` | `ExternalOption`           | Format-level external declarations merged on top of shared `external`.                                        |
| `output`   | `Omit<OutputOptions, ...>` | Low-level Rollup output options not covered by the fields above.                                              |

```ts
// ESM + CJS
defineConfig({
	bundles: [{ input: "src/index.ts", file: "my-lib" }],
	formats: { cjs: true },
});

// Two UMD outputs — development and minified production
defineConfig({
	bundles: [{ input: "src/index.ts", file: "my-lib", name: "MyLib" }],
	formats: {
		umd: [
			{ plugins: { replace: { "process.env.NODE_ENV": JSON.stringify("development") } } },
			{
				plugins: {
					replace: { "process.env.NODE_ENV": JSON.stringify("production") },
					terser: true,
				},
			},
		],
	},
});
```

### `plugins`

Opt-in pre-configured plugins shared across all bundles and formats. All are disabled by default. Format-level plugin configs are merged on top of these.

| Plugin    | Option                                     | Description                                                                          |
| --------- | ------------------------------------------ | ------------------------------------------------------------------------------------ |
| `node`    | `boolean \| RollupNodeResolveOptions`      | `@rollup/plugin-node-resolve` — resolves bare module specifiers from `node_modules`. |
| `babel`   | `boolean \| RollupBabelInputPluginOptions` | `@rollup/plugin-babel` — transpiles with Babel.                                      |
| `json`    | `boolean \| RollupJsonOptions`             | `@rollup/plugin-json` — allows importing `.json` files.                              |
| `replace` | `RollupReplaceOptions`                     | `@rollup/plugin-replace` — replaces strings at build time.                           |
| `terser`  | `boolean \| TerserOptions`                 | `@rollup/plugin-terser` — minifies the output.                                       |
| `extra`   | `Plugin[]`                                 | Additional plugins appended at the end of the pipeline.                              |

Plugin execution order: `node-resolve` → `json` → `babel` → `replace` → `terser` → `extra`.

```ts
defineConfig({
	bundles: [{ input: "src/index.ts", file: "my-lib" }],
	plugins: {
		node: true,
		babel: true,
		extra: [myPlugin()],
	},
});
```

### `external`

Module IDs, patterns, or a function that determines which imports are excluded from the bundle.

Keys declared in `globals` are automatically added to externals — no need to repeat them.

```ts
defineConfig({
	bundles: [{ input: "src/index.ts", file: "my-lib" }],
	external: ["react", "react-dom", /^node:/],
});
```

### `globals`

Maps external module IDs to their global variable names. Required for UMD and IIFE formats when external dependencies are present. Globals keys are automatically added to `external`.

```ts
defineConfig({
	bundles: [{ input: "src/index.ts", file: "my-lib", name: "MyLib" }],
	formats: { umd: true },
	globals: { react: "React", "react-dom": "ReactDOM" },
});
```

### `treeshake`

Controls dead code elimination. Accepts a preset (`'smallest'`, `'safest'`, `'recommended'`) or a fine-grained Rollup config object.

```ts
defineConfig({
	bundles: [{ input: "src/index.ts", file: "my-lib" }],
	treeshake: "smallest",
});
```

### `onwarn`

Custom handler for Rollup build warnings.

```ts
defineConfig({
	bundles: [{ input: "src/index.ts", file: "my-lib" }],
	onwarn(warning, defaultHandler) {
		if (warning.code === "CIRCULAR_DEPENDENCY") return;
		defaultHandler(warning);
	},
});
```

## Peer dependencies

| Package                       | Required                            |
| ----------------------------- | ----------------------------------- |
| `rollup`                      | Yes                                 |
| `@rollup/plugin-node-resolve` | Only when `plugins.node` is used    |
| `@rollup/plugin-babel`        | Only when `plugins.babel` is used   |
| `@rollup/plugin-json`         | Only when `plugins.json` is used    |
| `@rollup/plugin-replace`      | Only when `plugins.replace` is used |
| `@rollup/plugin-terser`       | Only when `plugins.terser` is used  |

## License

MIT
