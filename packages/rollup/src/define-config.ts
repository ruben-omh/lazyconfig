import type { ExternalOption, GlobalsOption, RollupOptions } from "rollup";
import type {
	BundleOptions,
	DefineConfigOptions,
	FormatOutputOptions,
	Formats,
	PluginsOptions,
	SupportedFormat,
} from "./types";
import { mergePlugins, buildPlugins } from "./resolvers/plugins";
import { mergeGlobals } from "./resolvers/globals";
import { resolveExternal } from "./resolvers/external";
import { resolveOutputOptions } from "./resolvers/outputs";
import { NAME_REQUIRED_FORMATS, SUPPORTED_FORMATS } from "./constants";

/**
 * Normalises a {@link FormatConfig} value into an array of {@link FormatOutputOptions}.
 *
 * - `false`               → `null` — format should be skipped entirely
 * - `true` / `undefined`  → `[{}]` — one output with all defaults
 * - `FormatOutputOptions` → `[item]` — one output with user overrides
 * - `FormatOutputOptions[]` → returned as-is — multiple outputs for the same format
 */
function normaliseFormatConfig(config: Formats[SupportedFormat]): FormatOutputOptions[] | null {
	if (config === false) return null;
	if (config === true || config === undefined) return [{}];
	if (Array.isArray(config)) return config;
	return [config];
}

/**
 * Validates that a format requiring a `name` (UMD / IIFE) has one provided.
 * Logs a warning and returns `false` when the requirement is not met,
 * causing the format to be skipped.
 *
 * @param format - The format being validated.
 * @param name   - The bundle-level `name` option.
 * @returns `true` if the format can proceed, `false` if it should be skipped.
 */
function validateNameRequirement(format: SupportedFormat, name: string | undefined): boolean {
	if (!NAME_REQUIRED_FORMATS.has(format) || name) return true;

	// eslint-disable-next-line no-console
	console.warn(
		`[@lazyconfig/rollup] Format "${format}" requires a "name". ` +
			`Add { name: "MyLib" } to the bundle options or disable this format with { ${format}: false }.`,
	);
	return false;
}

/**
 * Builds all Rollup configs for a single bundle entry.
 *
 * Iterates over every enabled format. Array format configs produce one
 * `RollupOptions` per item — each with its own merged plugin pipeline,
 * globals, and external declarations. Formats listed in
 * {@link BundleOptions.omitFormats} are skipped for this bundle only.
 *
 * @param bundle           - The individual bundle entry configuration.
 * @param formats          - Format enable/disable/override map.
 * @param sharedPlugins    - Shared plugin config applied to every format output.
 * @param sharedGlobals    - Shared globals map applied to every format output.
 * @param sharedExternal   - Shared external declarations applied to every format output.
 * @param rollupPassthrough - Rollup input options forwarded verbatim (`treeshake`, `onwarn`, `watch`).
 * @returns An array of `RollupOptions` — one per active format output.
 */
function buildBundleConfigs(
	bundle: BundleOptions,
	formats: Formats,
	sharedPlugins: PluginsOptions | undefined,
	sharedGlobals: GlobalsOption | undefined,
	sharedExternal: ExternalOption | undefined,
	rollupPassthrough: Pick<RollupOptions, "treeshake" | "onwarn" | "watch">,
): RollupOptions[] {
	const results: RollupOptions[] = [];

	for (const format of SUPPORTED_FORMATS) {
		const formatConfig = formats[format];
		const items = normaliseFormatConfig(formatConfig);

		if (!items) continue; // format: false
		if (bundle.omitFormats?.includes(format)) continue; // excluded by bundle

		for (const item of items) {
			if (!validateNameRequirement(format, bundle.name)) continue;

			const mergedPlugins = mergePlugins(sharedPlugins, item.plugins);
			const mergedGlobals = mergeGlobals(sharedGlobals, item.globals);
			const external = resolveExternal(sharedExternal, item.external, mergedGlobals);

			results.push({
				input: bundle.input,
				output: resolveOutputOptions(format, item, bundle, mergedGlobals),
				plugins: buildPlugins(mergedPlugins),
				...(external === undefined ? {} : { external }),
				...rollupPassthrough,
			});
		}
	}

	return results;
}

/**
 * Defines a Rollup configuration for one or more library bundles.
 *
 * Returns an array of `RollupOptions` — one entry per active (bundle × format) pair.
 * Array format configs (e.g. `umd: [devItem, prodItem]`) produce multiple entries
 * for the same format; use the `ext` or `suffix` field on each item to prevent
 * filename collisions.
 *
 * Shared options (`globals`, `plugins`, `external`) serve as a baseline for every
 * format output. Format-level overrides in {@link FormatOutputOptions} are merged
 * additively on top.
 *
 * @example
 * ```ts
 * // rollup.config.ts
 * import { defineConfig } from "@lazyconfig/rollup";
 *
 * export default defineConfig({
 *   bundles: [{ input: "src/index.ts", name: "MyLib", file: "my-lib" }],
 *   external: ["react"],
 *   globals: { react: "React" },
 *   plugins: { node: true, babel: true },
 *   formats: {
 *     es: true,
 *     cjs: true,
 *     umd: [
 *       { ext: "umd.dev.js",  plugins: { replace: { "process.env.NODE_ENV": '"development"' } } },
 *       { ext: "umd.prod.js", plugins: { replace: { "process.env.NODE_ENV": '"production"' }, terser: true } },
 *     ],
 *   },
 * });
 * ```
 */
export function defineConfig(config: DefineConfigOptions): RollupOptions[] {
	const {
		bundles,
		globals: sharedGlobals,
		plugins: sharedPlugins,
		external: sharedExternal,
		formats = {},
		treeshake,
		onwarn,
		watch,
	} = config;

	// Default ESM format to enabled when not explicitly configured.
	const resolvedFormats: Formats = {
		es: true,
		cjs: false,
		umd: false,
		iife: false,
		amd: false,
		system: false,
		...formats,
	};

	const rollupPassthrough: Pick<RollupOptions, "treeshake" | "onwarn" | "watch"> = {
		...(treeshake === undefined ? {} : { treeshake }),
		...(onwarn === undefined ? {} : { onwarn }),
		...(watch === undefined ? {} : { watch }),
	};

	return bundles.flatMap((bundle) =>
		buildBundleConfigs(
			bundle,
			resolvedFormats,
			sharedPlugins,
			sharedGlobals,
			sharedExternal,
			rollupPassthrough,
		),
	);
}
