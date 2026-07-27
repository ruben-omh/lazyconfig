import type { Linter } from "eslint";
import { base } from "./configs/base";
import { typescript } from "./configs/typescript";
import { react } from "./configs/react";
import { a11y } from "./configs/a11y";
import { node } from "./configs/node";
import { prettier } from "./configs/prettier";
import { DEFAULT_IGNORE_PATTERNS, ignores as ignoresPreset } from "./configs/ignores";

/**
 * Options for {@link defineConfig}.
 * All presets are opt-in except `base`, which is always included.
 */
export interface DefineConfigOptions {
	/** Enable TypeScript rules via `typescript-eslint`. Requires `typescript-eslint` to be installed. */
	typescript?: boolean;

	/** Enable React and React Hooks rules. Requires `eslint-plugin-react` and `eslint-plugin-react-hooks` to be installed. */
	react?: boolean;

	/**
	 * Enable JSX accessibility rules via `eslint-plugin-jsx-a11y`.
	 * Requires `eslint-plugin-jsx-a11y` to be installed.
	 *
	 * Should be used alongside `react: true`.
	 */
	a11y?: boolean;

	/** Enable Node.js specific rules via `eslint-plugin-n`. Requires `eslint-plugin-n` to be installed. */
	node?: boolean;

	/**
	 * Disable ESLint formatting rules that conflict with Prettier.
	 * Requires `eslint-config-prettier` to be installed.
	 *
	 * Always applied last, regardless of option order.
	 */
	prettier?: boolean;

	/**
	 * Ignore patterns applied at the top of the config.
	 *
	 * - `true` — use the default ignore patterns
	 * - `string[]` — use the default patterns plus additional ones
	 *
	 * @example
	 * ```js
	 * // Use defaults
	 * defineConfig({ ignores: true })
	 *
	 * // Extend defaults with additional patterns
	 * defineConfig({ ignores: ['**\/.next/**', '**\/storybook-static/**'] })
	 * ```
	 */
	ignores?: boolean | string[];

	/**
	 * Additional ESLint flat config entries appended after all presets
	 * but before `prettier` (if enabled). Use this for project-specific
	 * rule overrides.
	 *
	 * @example
	 * ```js
	 * defineConfig({
	 *   typescript: true,
	 *   extends: [
	 *     { rules: { 'no-console': 'off' } },
	 *   ],
	 * })
	 * ```
	 */
	extends?: Linter.Config[];
}

/**
 * Builds an ESLint flat config array from the selected presets.
 * The `base` preset is always included. All other presets are opt-in.
 *
 * @param options - Presets to enable and optional config extensions.
 * @returns A merged ESLint flat config array ready to be used as the
 * default export of `eslint.config.js`.
 *
 * @example
 * ```js
 * // eslint.config.js
 *
 * // Base only (default)
 * import { defineConfig } from '@lazyconfig/eslint';
 * export default defineConfig();
 *
 * // TypeScript + React + Prettier + default ignores
 * export default defineConfig({
 *   typescript: true,
 *   react: true,
 *   prettier: true,
 *   ignores: true,
 * });
 *
 * // Extend default ignores with additional patterns
 * export default defineConfig({
 *   typescript: true,
 *   ignores: ['**\/.next/**', '**\/storybook-static/**'],
 * });
 *
 * // With custom overrides
 * export default defineConfig({
 *   typescript: true,
 *   node: true,
 *   prettier: true,
 *   extends: [
 *     { rules: { 'no-console': 'off' } },
 *   ],
 * });
 * ```
 */
export function defineConfig(options?: DefineConfigOptions): Linter.Config[] {
	const config: Linter.Config[] = [];

	// ignores must come first in flat config
	if (options?.ignores) {
		const extra = Array.isArray(options.ignores) ? options.ignores : [];
		if (extra.length > 0) {
			config.push({ ignores: [...DEFAULT_IGNORE_PATTERNS, ...extra] });
		} else {
			config.push(...ignoresPreset);
		}
	}

	config.push(...base);

	if (options?.typescript) {
		config.push(...typescript());
	}

	if (options?.react) {
		config.push(...react());
	}

	if (options?.a11y) {
		if (!options.react) {
			console.warn(
				"[@lazyconfig/eslint] defineConfig: a11y preset is intended to be used alongside react: true.",
			);
		}
		config.push(...a11y());
	}

	if (options?.node) {
		config.push(...node());
	}

	if (options?.extends?.length) {
		config.push(...options.extends);
	}

	// prettier is always last — it must override any formatting rules
	// introduced by other presets or custom extends
	if (options?.prettier) {
		config.push(...prettier());
	}

	return config;
}
