import type { Plugin } from "rollup";
import type { PluginsOptions } from "../../types";
import { babelOptions, jsonOptions, nodeOptions, replaceOptions, terserOptions } from "./options";

/**
 * Merges two {@link PluginsOptions} objects, with `override` taking precedence over `base`.
 *
 * - For each named plugin (`node`, `babel`, etc.): `override` wins when explicitly set.
 * - For `extra`: arrays are concatenated — `base.extra` first, then `override.extra`.
 *
 * @param base     - The shared (top-level) plugin config.
 * @param override - The format-level plugin config that takes precedence.
 * @returns A merged `PluginsOptions` reflecting both layers.
 */
export function mergePlugins(
	base: PluginsOptions | undefined,
	override: PluginsOptions | undefined,
): PluginsOptions {
	if (!base && !override) return {};
	if (!base) return override ?? {};
	if (!override) return base ?? {};

	return {
		node: override.node ?? base.node,
		babel: override.babel ?? base.babel,
		json: override.json ?? base.json,
		replace: override.replace ?? base.replace,
		terser: override.terser ?? base.terser,
		extra: [...(base.extra ?? []), ...(override.extra ?? [])],
	};
}

/**
 * Builds the ordered list of Rollup plugins from a resolved {@link PluginsOptions}.
 * Only enabled plugins are included.
 *
 * Pipeline order:
 * 1. `node`    — locate bare module specifiers in `node_modules` before transforms
 * 2. `json`    — make `.json` files importable as ES Modules
 * 3. `babel`   — transpile with Babel
 * 4. `replace` — string substitution after transpilation
 * 5. `terser`  — minification last
 * 6. `extra`   — any additional plugins appended at the end
 *
 * @param options - The merged plugin config (shared + format-level).
 * @returns An ordered array of active Rollup {@link Plugin} instances.
 */
export function buildPlugins(options: PluginsOptions): Plugin[] {
	const {
		node: nodeConfig = false,
		babel: babelConfig = false,
		json: jsonConfig = false,
		replace: replaceConfig = false,
		terser: terserConfig = false,
		extra = [],
	} = options;

	const plugins: Plugin[] = [];

	// 1. node — resolve bare module specifiers from node_modules
	if (nodeConfig) {
		plugins.push(nodeOptions(nodeConfig));
	}

	// 2. json — import .json files as ES Modules
	if (jsonConfig) {
		plugins.push(jsonOptions(jsonConfig));
	}

	// 3. babel — transpile with Babel (pure annotations always included)
	if (babelConfig) {
		plugins.push(babelOptions(babelConfig));
	}

	// 4. replace — string substitution after transpilation
	if (replaceConfig) {
		plugins.push(replaceOptions(replaceConfig));
	}

	// 5. terser — minification last
	if (terserConfig) {
		plugins.push(terserOptions(terserConfig));
	}

	// 6. extra — user-supplied additional plugins
	plugins.push(...extra);

	return plugins;
}
