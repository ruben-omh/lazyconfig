import type { ESLint, Linter } from "eslint";
import { requirePeer, tryRequirePeer } from "../helpers/require-peer";

interface NodePlugin {
	configs: { recommended: { rules: Linter.RulesRecord } };
}
interface GlobalsNamespace {
	browser: Record<string, boolean>;
	node: Record<string, boolean>;
}

/**
 * Node.js specific rules via `eslint-plugin-n`.
 * Catches common Node.js mistakes such as importing unavailable
 * built-in modules, using deprecated APIs, and missing file extensions
 * in ESM imports.
 *
 * @example
 * ```js
 * // eslint.config.js
 * import { base, typescript, node } from '@lazyconfig/eslint';
 *
 * export default [...base, ...typescript(), ...node()];
 * ```
 *
 * @throws When `eslint-plugin-n` is not installed.
 */
export function node(): Linter.Config[] {
	const nodePlugin = requirePeer<NodePlugin>("eslint-plugin-n", "node");
	const globalsObj = tryRequirePeer<GlobalsNamespace>("globals");

	return [
		{
			plugins: {
				n: nodePlugin as unknown as ESLint.Plugin,
			},
			languageOptions: {
				...(globalsObj && { globals: globalsObj.node }),
			},
			rules: {
				...nodePlugin.configs.recommended.rules,

				// Disallow use of deprecated Node.js APIs
				"n/no-deprecated-api": "error",

				// Disabled — TypeScript's module resolution catches missing imports more accurately,
				// and the rule produces false positives for barrel files and bundler-resolved paths.
				"n/no-missing-import": "off",

				// Disallow process.exit() — prefer throwing errors
				"n/no-process-exit": "error",
			},
		},
	];
}
