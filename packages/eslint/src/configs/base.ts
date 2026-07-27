import js from "@eslint/js";
import type { Linter } from "eslint";

/**
 * Core JavaScript rules applied to all file types.
 * Extends `eslint:recommended` with sensible defaults for
 * modern JavaScript projects.
 *
 * @example
 * ```js
 * // eslint.config.js
 * import { base } from '@lazyconfig/eslint';
 *
 * export default [...base];
 * ```
 */
export const base: Linter.Config[] = [
	js.configs.recommended,
	{
		rules: {
			// Disallow console statements — use a logger instead
			"no-console": "warn",

			// Disallow debugger statements left in code
			"no-debugger": "error",

			// Warn on variables declared but never used
			"no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],

			// Disallow variable declarations that shadow outer scope variables
			"no-shadow": "error",

			// Require const for variables that are never reassigned
			"prefer-const": "error",

			// Disallow var — use let or const
			"no-var": "error",

			// Prefer template literals over string concatenation
			"prefer-template": "warn",

			// Enforce using dot notation when accessing properties (e.g. obj.foo over obj["foo"])
			"dot-notation": "error",

			// Disallow unnecessary return statements at the end of a function
			"no-useless-return": "error",

			// Disallow unnecessary else blocks after a return statement
			"no-else-return": "error",
		},
	},
];
