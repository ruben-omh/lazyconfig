import type {
	Plugin,
	GlobalsOption,
	ModuleFormat,
	InputOption,
	OutputOptions,
	InputOptions,
	ExternalOption,
} from "rollup";
import type { RollupBabelInputPluginOptions } from "@rollup/plugin-babel";
import type { RollupNodeResolveOptions } from "@rollup/plugin-node-resolve";
import type { RollupJsonOptions } from "@rollup/plugin-json";
import type { RollupReplaceOptions } from "@rollup/plugin-replace";
import type { Options as TerserOptions } from "@rollup/plugin-terser";

// ─── Utility ──────────────────────────────────────────────────────────────────

/**
 * A plugin option can be:
 * - `false` — disabled
 * - `true`  — enabled with defaults
 * - `object` — enabled with custom options that extend the defaults
 */
export type PluginConfig<T> = boolean | T;

// ─── Formats ──────────────────────────────────────────────────────────────────

/**
 * The six Rollup output formats supported by `defineConfig`.
 *
 * - `es`     — ES Module (`.mjs`) — for modern bundlers and Node.js ESM
 * - `cjs`    — CommonJS (`.cjs`) — for Node.js `require()` and legacy bundlers
 * - `umd`    — Universal Module Definition — browsers, AMD loaders, and Node.js
 * - `iife`   — Immediately Invoked Function Expression — direct browser `<script>` inclusion
 * - `amd`    — Asynchronous Module Definition — AMD loaders such as RequireJS
 * - `system` — SystemJS module loader format
 */
export type SupportedFormat = Extract<
	ModuleFormat,
	"es" | "cjs" | "umd" | "iife" | "amd" | "system"
>;

/**
 * Per-format output overrides.
 *
 * Allows each format to define its own `suffix`, `globals`, plugin pipeline,
 * and any additional Rollup `OutputOptions` not controlled at the bundle level.
 *
 * Options intentionally excluded from `output` because they are managed
 * at a higher level:
 * - `file`      — derived from {@link BundleOptions.file} + format identifier + `suffix` + extension
 * - `format`    — inferred from the format key (`es`, `cjs`, etc.)
 * - `name`      — from {@link BundleOptions.name}
 * - `sourcemap` — from {@link BundleOptions.sourcemap}
 * - `banner`    — from {@link BundleOptions.banner}
 * - `footer`    — from {@link BundleOptions.footer}
 * - `plugins`   — controlled via {@link PluginsOptions}, not raw Rollup plugins
 */
export type FormatOutputOptions = {
	/**
	 * File extension for this format output, **without** the leading dot.
	 * Overrides the default extension derived from the format.
	 *
	 * Defaults:
	 * - `es`     → `mjs`
	 * - `cjs`    → `cjs`
	 * - `umd` / `iife` / `amd` / `system` → `js`
	 *
	 * Use this when you need a non-standard extension — for example, a `.js`
	 * ESM output for environments that do not recognise `.mjs`.
	 *
	 * @example 'js'    → `my-lib.js`        (ES build with .js instead of .mjs)
	 * @example 'min.js' → `my-lib.min.js`   (combined suffix + extension in one field)
	 */
	ext?: string;

	/**
	 * Maps external module IDs to global variable names for this format.
	 * Merged on top of the shared {@link DefineConfigOptions.globals} — format-level
	 * values take precedence.
	 *
	 * @example { react: 'React', 'react-dom': 'ReactDOM' }
	 */
	globals?: GlobalsOption;

	/**
	 * Plugin overrides for this specific format.
	 * Merged on top of the shared {@link DefineConfigOptions.plugins}.
	 */
	plugins?: PluginsOptions;

	/**
	 * External overrides for this specific format.
	 * Merged on top of the shared {@link DefineConfigOptions.external}.
	 */
	external?: ExternalOption;

	/**
	 * Additional Rollup output options for this format.
	 * Use this for low-level overrides not covered by the other fields.
	 */
	output?: Omit<
		OutputOptions,
		"file" | "format" | "name" | "sourcemap" | "banner" | "footer" | "plugins"
	>;
};

/**
 * Configuration for a single output format. Accepts:
 *
 * - `false`                    — format disabled entirely
 * - `true`                     — enabled with defaults
 * - `object`                   — enabled with per-format overrides
 * - `object[]`                 — multiple outputs for the same format (e.g. a
 *                                development build and a minified production build)
 *
 * @example
 * // Single UMD output
 * umd: { globals: { react: 'React' } }
 *
 * @example
 * // Two UMD outputs — dev and minified prod
 * umd: [
 *   { plugins: { replace: { 'process.env.NODE_ENV': '"development"' } } },
 *   { plugins: { replace: { 'process.env.NODE_ENV': '"production"' }, terser: true } },
 * ]
 */
export type FormatConfig = boolean | FormatOutputOptions | FormatOutputOptions[];

/**
 * Controls which output formats are emitted and how each is configured.
 * Only `es` is enabled by default. Set a format to `true` or pass a {@link FormatOutputOptions}
 * object to enable it, or `false` to explicitly disable it.
 *
 * @example
 * // ESM + CJS only
 * formats: { umd: false, iife: false, amd: false, system: false }
 *
 * @example
 * // Custom UMD globals
 * formats: { umd: { globals: { react: 'React' } } }
 */
export type Formats = {
	/**
	 * **ES Module** output — `<file>.mjs`
	 *
	 * Ideal for modern bundlers (Vite, webpack, Rollup) and Node.js ESM. Enables tree-shaking.
	 *
	 * @default true
	 */
	es?: FormatConfig;

	/**
	 * **CommonJS** output — `<file>.cjs`
	 *
	 * For Node.js `require()` and legacy bundlers.
	 *
	 * @default false
	 */
	cjs?: FormatConfig;

	/**
	 * **Universal Module Definition** output — `<file>.umd.js`
	 *
	 * Works in browsers (via `<script>`), AMD loaders, and Node.js.
	 * Requires {@link BundleOptions.name} — skipped with a warning if omitted.
	 *
	 * @default false
	 */
	umd?: FormatConfig;

	/**
	 * **Immediately Invoked Function Expression** output — `<file>.iife.js`
	 *
	 * For direct browser `<script>` inclusion.
	 * Requires {@link BundleOptions.name} — skipped with a warning if omitted.
	 *
	 * @default false
	 */
	iife?: FormatConfig;

	/**
	 * **AMD** output — `<file>.amd.js`
	 *
	 * For AMD loaders such as RequireJS.
	 *
	 * @default false
	 */
	amd?: FormatConfig;

	/**
	 * **SystemJS** output — `<file>.system.js`
	 *
	 * For SystemJS module loaders.
	 *
	 * @default false
	 */
	system?: FormatConfig;
};

// ─── Plugins ──────────────────────────────────────────────────────────────────

export interface PluginsOptions {
	/**
	 * **`@rollup/plugin-node-resolve`** — resolves bare module specifiers from `node_modules`.
	 *
	 * Defaults to the standard JS / TS / JSX extensions when enabled.
	 *
	 * - `false` — disabled (default)
	 * - `true`  — enabled with defaults
	 * - `object` — enabled with custom `RollupNodeResolveOptions`
	 *
	 * @default false
	 * @see https://github.com/rollup/plugins/tree/master/packages/node-resolve
	 */
	node?: PluginConfig<RollupNodeResolveOptions>;

	/**
	 * **`@rollup/plugin-babel`** — transpiles source files with Babel.
	 *
	 * Defaults to `babelHelpers: 'bundled'` and the standard JS / TS / JSX extensions.
	 *
	 * - `false` — disabled (default)
	 * - `true`  — enabled with defaults
	 * - `object` — enabled with custom `RollupBabelInputPluginOptions`
	 *
	 * @default false
	 * @see https://github.com/rollup/plugins/tree/master/packages/babel
	 */
	babel?: PluginConfig<RollupBabelInputPluginOptions>;

	/**
	 * **`@rollup/plugin-json`** — allows importing `.json` files as ES Modules.
	 *
	 * - `false` — disabled (default)
	 * - `true`  — enabled with defaults
	 * - `object` — enabled with custom `RollupJsonOptions`
	 *
	 * @default false
	 * @see https://github.com/rollup/plugins/tree/master/packages/json
	 */
	json?: PluginConfig<RollupJsonOptions>;

	/**
	 * **`@rollup/plugin-replace`** — replaces strings in source files at build time.
	 *
	 * Defaults to `preventAssignment: true` to avoid accidentally replacing assignment targets.
	 * Pair with `terser` for production builds to eliminate dead code branches.
	 *
	 * - `false` — disabled (default)
	 * - `true`  — enabled (provide replacements via the object form)
	 * - `object` — enabled with custom `RollupReplaceOptions`
	 *
	 * @default false
	 * @see https://github.com/rollup/plugins/tree/master/packages/replace
	 *
	 * @example
	 * replace: { 'process.env.NODE_ENV': JSON.stringify('production') }
	 */
	replace?: PluginConfig<RollupReplaceOptions>;

	/**
	 * **`@rollup/plugin-terser`** — minifies the output for production.
	 *
	 * Intended for production builds only — most library authors omit this and let
	 * the consuming application's bundler handle minification. Most useful for
	 * UMD / IIFE bundles shipped as CDN assets via `<script>` tags.
	 * Pair with `replace` to eliminate dead code before minifying.
	 *
	 * - `false` — disabled (default)
	 * - `true`  — enabled with defaults
	 * - `object` — enabled with custom `TerserOptions`
	 *
	 * @default false
	 * @see https://github.com/rollup/plugins/tree/master/packages/terser
	 */
	terser?: PluginConfig<TerserOptions>;

	/**
	 * Additional Rollup plugins appended to the end of the pipeline.
	 * Use this for plugins not covered by the pre-configured options above.
	 *
	 * @see https://rollupjs.org/guide/en/#plugins
	 *
	 * @example
	 * extra: [visualizer(), alias({ entries: { '@': 'src' } })]
	 */
	extra?: Plugin[];
}

// ─── Bundle ───────────────────────────────────────────────────────────────────

/**
 * Configuration for a single bundle entry — one `input` producing one set of output files.
 * Pass multiple `BundleOptions` objects in {@link DefineConfigOptions.bundles} to produce
 * independent bundles (e.g. a main library entry and a separate CLI entry).
 */
export interface BundleOptions {
	/**
	 * Entry point(s) for this bundle.
	 *
	 * @example 'src/index.ts'
	 * @example ['src/index.ts', 'src/utils.ts']
	 * @example { index: 'src/index.ts', utils: 'src/utils.ts' }
	 */
	input: InputOption;

	/**
	 * Base name of the emitted output files, without extension.
	 * The format suffix and extension are appended automatically.
	 *
	 * @default 'bundle'
	 * @example 'my-library' → `my-library.mjs`, `my-library.cjs`, `my-library.umd.js`, …
	 */
	file?: string;

	/**
	 * Directory to write all generated bundles to.
	 *
	 * @default 'dist'
	 */
	outputDir?: string;

	/**
	 * Global variable name exposed on `window` for UMD and IIFE bundles.
	 * UMD and IIFE formats are skipped with a warning when this is omitted.
	 *
	 * @example 'MyLibrary'
	 * @example 'React'
	 */
	name?: string;

	/**
	 * Adds source maps to the generated output files.
	 *
	 * - `true`     — external `.map` file
	 * - `'inline'` — inlined at the end of each file
	 * - `'hidden'` — external `.map` file without the `//# sourceMappingURL` comment
	 *
	 * @default false
	 */
	sourcemap?: boolean | "inline" | "hidden";

	/**
	 * Banner prepended to each output file.
	 * Useful for license headers or version stamps.
	 *
	 * @example '/* MyLib v1.0.0 — MIT License *\/'
	 */
	banner?: string | (() => string | Promise<string>);

	/**
	 * Footer appended to each output file.
	 * Useful for closing remarks or runtime version stamps.
	 */
	footer?: string | (() => string | Promise<string>);

	/**
	 * Formats to exclude for this specific bundle, overriding the shared
	 * {@link DefineConfigOptions.formats} configuration.
	 *
	 * Useful when multiple bundles share a common format config but one of them
	 * should not emit a particular format — for example, a CLI entry that only
	 * needs CJS while the main library entry emits both ESM and CJS.
	 *
	 * @example
	 * ```ts
	 * defineConfig({
	 *   bundles: [
	 *     { input: "src/index.ts", file: "my-lib" },
	 *     { input: "src/cli.ts",   file: "cli", omitFormats: ["es"] },
	 *   ],
	 *   formats: { es: true, cjs: true },
	 * });
	 * ```
	 */
	omitFormats?: SupportedFormat[];
}

// ─── Config ───────────────────────────────────────────────────────────────────

/**
 * Root configuration object passed to {@link defineConfig}.
 *
 * `bundles` is the only required field. Everything else — globals, plugins,
 * formats, and Rollup passthrough options — is optional and shared across all bundles.
 * Individual bundles and formats can override shared values where needed.
 */
export interface DefineConfigOptions {
	/**
	 * One or more bundle entries to build.
	 * Each entry is independent — its own `input`, `file`, `name`, and `external`.
	 * All bundles share the top-level `globals`, `plugins`, and `formats` unless
	 * overridden at the format level via {@link FormatOutputOptions}.
	 */
	bundles: BundleOptions[];

	/**
	 * Maps external module IDs to their global variable names.
	 * Shared across all bundles and formats as a baseline.
	 * Format-level `globals` in {@link FormatOutputOptions} are merged on top of these.
	 *
	 * Required for UMD and IIFE formats when external dependencies are used in a browser context.
	 *
	 * @example { react: 'React', 'react-dom': 'ReactDOM' }
	 */
	globals?: GlobalsOption;

	/**
	 * Module IDs, patterns, or a function that determines which imports are
	 * excluded from the bundle and left as `import`/`require` calls in the output.
	 *
	 * Keys declared in {@link DefineConfigOptions.globals} or format-level `globals`
	 * are automatically added to externals — you do not need to repeat them here.
	 * Use this field for dependencies that should be external but have no global
	 * variable name (e.g. peer dependencies in an ES or CJS library build).
	 *
	 * @example ['react', 'react-dom']
	 * @example /^lodash/
	 * @example (id) => id.includes('node_modules')
	 */
	external?: ExternalOption;

	/**
	 * Opt-in pre-configured plugins shared across all bundles and formats.
	 * All plugins are **disabled by default**.
	 * Format-level plugins in {@link FormatOutputOptions} are merged on top of these.
	 *
	 * @example
	 * ```ts
	 * plugins: {
	 *   node: true,
	 *   babel: true,
	 *   replace: { 'process.env.NODE_ENV': JSON.stringify('production') },
	 *   terser: true,
	 * }
	 * ```
	 */
	plugins?: PluginsOptions;

	/**
	 * Controls which output formats are emitted and how each is configured.
	 * Only `es` is enabled by default. All other formats must be explicitly enabled.
	 *
	 * @example
	 * // ESM + CJS
	 * formats: { cjs: true }
	 *
	 * @example
	 * // ESM + CJS + UMD
	 * formats: { cjs: true, umd: { globals: { react: 'React' } } }
	 */
	formats?: Formats;

	/**
	 * Controls how aggressively Rollup eliminates dead code.
	 * Accepts a preset string (`'smallest'`, `'safest'`, `'recommended'`) or a fine-grained config.
	 *
	 * @see https://rollupjs.org/configuration-options/#treeshake
	 */
	treeshake?: InputOptions["treeshake"];

	/**
	 * Custom handler for build warnings.
	 * Use this to suppress, reformat, or escalate specific warnings.
	 *
	 * @see https://rollupjs.org/configuration-options/#onwarn
	 */
	onwarn?: InputOptions["onwarn"];

	/**
	 * Watch mode options. Only relevant when running `rollup --watch`.
	 *
	 * @see https://rollupjs.org/configuration-options/#watch
	 */
	watch?: InputOptions["watch"];
}
