import type { Plugin } from "rollup";
import type { RollupBabelInputPluginOptions } from "@rollup/plugin-babel";
import type { RollupNodeResolveOptions } from "@rollup/plugin-node-resolve";
import type { RollupJsonOptions } from "@rollup/plugin-json";
import type { RollupReplaceOptions } from "@rollup/plugin-replace";
import type { Options as TerserOptions } from "@rollup/plugin-terser";
import { DEFAULT_EXTENSIONS } from "../../constants";
import { requirePeer } from "../../helpers/require-peer";

interface BabelNamespace {
	babel: (opts: RollupBabelInputPluginOptions) => Plugin;
}
interface NodeResolveNamespace {
	nodeResolve: (opts: RollupNodeResolveOptions) => Plugin;
}
type JsonFn = (opts: RollupJsonOptions) => Plugin;
type ReplaceFn = (opts: RollupReplaceOptions) => Plugin;
type TerserFn = (opts: TerserOptions) => Plugin;

/**
 * Creates the `@rollup/plugin-babel` instance with merged options.
 * Defaults to `babelHelpers: 'bundled'` and the standard JS / TS / JSX {@link DEFAULT_EXTENSIONS}.
 *
 * @param config - `true` to use defaults, or a custom {@link RollupBabelInputPluginOptions} object.
 */
export function babelOptions(config: boolean | RollupBabelInputPluginOptions): Plugin {
	const { babel } = requirePeer<BabelNamespace>("@rollup/plugin-babel");

	const userOpts: RollupBabelInputPluginOptions = typeof config === "object" ? config : {};

	return babel({
		babelHelpers: "bundled",
		extensions: DEFAULT_EXTENSIONS,
		...userOpts,
	});
}

/**
 * Creates the `@rollup/plugin-node-resolve` instance.
 * Defaults to {@link DEFAULT_EXTENSIONS} so it resolves the same file types as the Babel plugin.
 *
 * @param config - `true` to use defaults, or a custom {@link RollupNodeResolveOptions} object.
 */
export function nodeOptions(config: boolean | RollupNodeResolveOptions): Plugin {
	const { nodeResolve } = requirePeer<NodeResolveNamespace>("@rollup/plugin-node-resolve");

	const userOpts: RollupNodeResolveOptions = typeof config === "object" ? config : {};
	return nodeResolve({ extensions: DEFAULT_EXTENSIONS, ...userOpts });
}

/**
 * Creates the `@rollup/plugin-json` instance.
 * When `config` is `true`, the plugin runs with its own defaults.
 *
 * @param config - `true` to use defaults, or a custom {@link RollupJsonOptions} object.
 */
export function jsonOptions(config: boolean | RollupJsonOptions): Plugin {
	const json = requirePeer<JsonFn>("@rollup/plugin-json");

	const userOpts: RollupJsonOptions = typeof config === "object" ? config : {};
	return json(userOpts);
}

/**
 * Creates the `@rollup/plugin-replace` instance, enforcing `preventAssignment: true`
 * to avoid accidentally replacing assignment targets.
 *
 * @param config - `true` to use defaults, or a custom {@link RollupReplaceOptions} object.
 */
export function replaceOptions(config: boolean | RollupReplaceOptions): Plugin {
	const replace = requirePeer<ReplaceFn>("@rollup/plugin-replace");

	const userOpts: RollupReplaceOptions = typeof config === "object" ? config : {};
	return replace({ preventAssignment: true, ...userOpts });
}

/**
 * Creates the `@rollup/plugin-terser` instance.
 * When `config` is `true`, the plugin runs with its own defaults.
 * Intended for production builds — most useful for UMD / IIFE CDN bundles.
 *
 * @param config - `true` to use defaults, or a custom {@link TerserOptions} object.
 */
export function terserOptions(config: boolean | TerserOptions): Plugin {
	const terser = requirePeer<TerserFn>("@rollup/plugin-terser");

	const userOpts: TerserOptions = typeof config === "object" ? config : {};
	return terser(userOpts);
}
