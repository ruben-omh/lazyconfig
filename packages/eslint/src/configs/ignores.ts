import type { Linter } from "eslint";

/**
 * Glob patterns ignored by default.
 * Targets build artifacts, dependencies, and generated files
 * that should never be linted.
 */
export const DEFAULT_IGNORE_PATTERNS: string[] = [
	"**/dist/**",
	"**/build/**",
	"**/out/**",
	"**/out-tsc/**",
	"**/coverage/**",
	"**/node_modules/**",
	"**/.next/**",
	"**/.nuxt/**",
	"**/.output/**",
];

/**
 * ESLint flat config entry that ignores common build artifacts,
 * dependencies, and generated files.
 *
 * Opt-in — add via `defineConfig({ ignores: true })` or compose manually.
 *
 * @example
 * ```js
 * // eslint.config.js
 * import { base, typescript, ignores } from '@lazyconfig/eslint';
 *
 * export default [...ignores, ...base, ...typescript];
 * ```
 */
export const ignores: Linter.Config[] = [
	{
		ignores: DEFAULT_IGNORE_PATTERNS,
	},
];
