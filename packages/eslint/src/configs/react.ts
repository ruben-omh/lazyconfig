import type { ESLint, Linter } from "eslint";
import { requirePeer, tryRequirePeer } from "../helpers/require-peer";

interface ReactPlugin {
	configs: { recommended: { rules: Linter.RulesRecord } };
}
interface ReactHooksPlugin {
	configs: { recommended: { rules: Linter.RulesRecord } };
}
interface GlobalsNamespace {
	browser: Record<string, boolean>;
	node: Record<string, boolean>;
}

/**
 * React and React Hooks rules.
 * Assumes React 17+ with the automatic JSX transform
 * (no need to import React in every file).
 *
 * For accessibility rules, add the `a11y` preset separately.
 *
 * @example
 * ```js
 * // eslint.config.js
 * import { base, typescript, react } from '@lazyconfig/eslint';
 *
 * export default [...base, ...typescript(), ...react()];
 * ```
 *
 * @throws When `eslint-plugin-react` or `eslint-plugin-react-hooks` is not installed.
 */
export function react(): Linter.Config[] {
	const reactPlugin = requirePeer<ReactPlugin>("eslint-plugin-react", "react");
	const reactHooksPlugin = requirePeer<ReactHooksPlugin>("eslint-plugin-react-hooks", "react");
	const globalsObj = tryRequirePeer<GlobalsNamespace>("globals");

	return [
		{
			plugins: {
				// Cast required — eslint-plugin-react and eslint-plugin-react-hooks ship
				// types built against ESLint 8/9 internals that are incompatible with
				// ESLint 10's stricter RuleContext/SourceCode generics. Safe at runtime.
				react: reactPlugin as unknown as ESLint.Plugin,
				"react-hooks": reactHooksPlugin as unknown as ESLint.Plugin,
			},
			languageOptions: {
				...(globalsObj && { globals: globalsObj.browser }),
			},
			settings: {
				react: {
					// Automatically detect the React version
					version: "detect",
				},
			},
			rules: {
				// Recommended React rules
				...reactPlugin.configs.recommended.rules,

				// Recommended React Hooks rules
				...reactHooksPlugin.configs.recommended.rules,

				// Not needed with the automatic JSX transform (React 17+)
				"react/react-in-jsx-scope": "off",
				"react/jsx-uses-react": "off",

				// Enforce self-closing tags for components without children
				"react/self-closing-comp": "error",

				// Disallow array index as key prop — can cause subtle rendering bugs
				"react/no-array-index-key": "warn",

				// Warn on missing display name for React components
				"react/display-name": "warn",

				// Disallow passing children as a prop — use JSX children instead
				"react/no-children-prop": "error",
			},
		},
	];
}
