import type { ESLint, Linter } from "eslint";
import { requirePeer } from "../helpers/require-peer";

interface JsxA11yPlugin {
	configs: { recommended: { rules: Linter.RulesRecord } };
}

/**
 * JSX accessibility rules via `eslint-plugin-jsx-a11y`.
 * Enforces accessible HTML practices in JSX — ARIA attributes,
 * keyboard navigation, semantic elements, and more.
 *
 * Opt-in — add alongside the `react` preset when accessibility
 * compliance is required.
 *
 * @example
 * ```js
 * // eslint.config.js
 * import { base, typescript, react, a11y } from '@lazyconfig/eslint';
 *
 * export default [...base, ...typescript(), ...react(), ...a11y()];
 * ```
 *
 * @throws When `eslint-plugin-jsx-a11y` is not installed.
 */
export function a11y(): Linter.Config[] {
	const a11yPlugin = requirePeer<JsxA11yPlugin>("eslint-plugin-jsx-a11y", "a11y");

	return [
		{
			plugins: {
				"jsx-a11y": a11yPlugin as unknown as ESLint.Plugin,
			},
			rules: {
				...a11yPlugin.configs.recommended.rules,
			},
		},
	];
}
