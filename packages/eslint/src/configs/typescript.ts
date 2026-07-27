import type { Linter } from "eslint";
import { requirePeer } from "../helpers/require-peer";

interface TseslintNamespace {
	configs: {
		recommendedTypeChecked: Linter.Config[];
		disableTypeChecked: Linter.Config;
	};
}

/**
 * TypeScript rules using `typescript-eslint`.
 * Extends the recommended type-checked ruleset and replaces
 * base JS rules that have TypeScript-aware equivalents.
 *
 * Requires a `tsconfig.json` to be present in the project.
 *
 * @example
 * ```js
 * // eslint.config.js
 * import { base, typescript } from '@lazyconfig/eslint';
 *
 * export default [...base, ...typescript()];
 * ```
 *
 * @throws When `typescript-eslint` is not installed.
 */
export function typescript(): Linter.Config[] {
	const tseslint = requirePeer<TseslintNamespace>("typescript-eslint", "typescript");

	return [
		...tseslint.configs.recommendedTypeChecked,
		{
			languageOptions: {
				parserOptions: {
					projectService: true,
				},
			},
			rules: {
				// Replace base JS rule with TypeScript-aware equivalent
				"no-unused-vars": "off",
				"@typescript-eslint/no-unused-vars": [
					"warn",
					{ argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
				],

				// Replace base JS rule with TypeScript-aware equivalent
				"no-shadow": "off",
				"@typescript-eslint/no-shadow": "error",

				// Enforce explicit return types on functions and class methods
				"@typescript-eslint/explicit-function-return-type": [
					"warn",
					{ allowExpressions: true, allowTypedFunctionExpressions: true },
				],

				// Disallow the use of 'any' type
				"@typescript-eslint/no-explicit-any": "warn",

				// Enforce consistent use of type imports
				"@typescript-eslint/consistent-type-imports": [
					"error",
					{ prefer: "type-imports", fixStyle: "inline-type-imports" },
				],

				// Disallow floating promises (unhandled async operations)
				"@typescript-eslint/no-floating-promises": "error",

				// Disallow awaiting non-promise values
				"@typescript-eslint/await-thenable": "error",

				// Warn when async functions have no await expression
				"@typescript-eslint/require-await": "warn",
			},
		},
		// JS files are not part of any TypeScript project — disable type-aware rules and
		// the project service so the parser does not error on files not found in tsconfig
		{
			files: ["**/*.{js,mjs,cjs}"],
			...tseslint.configs.disableTypeChecked,
		},
	];
}
