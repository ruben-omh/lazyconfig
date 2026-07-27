import { defineConfig } from "@lazyconfig/eslint";

/** @type {import('@lazyconfig/eslint').DefineConfigOptions} */
const config = {
	node: true,
	typescript: true,
	prettier: true,
	ignores: [
		// ignore JSON base config packages
		"packages/tsconfig/**",
		"packages/commitlint/**",
		"packages/prettier/**",

		// ignore presets subpath exports
		"packages/presets/src/**",
	],
	extends: [
		{
			// cli package contains CLI scripts — console.error and process.exit() are intentional
			files: ["packages/cli/src/**"],
			rules: {
				"no-console": "off",
				"n/no-process-exit": "off",
			},
		},
		{
			// defineConfig warning is intentional user-facing output
			files: ["packages/eslint/src/define-config.ts"],
			rules: {
				"no-console": "off",
			},
		},
		{
			// scripts package is a private CJS package — require() and process.exit() are intentional,
			// and return type annotations do not apply to plain JS files
			files: ["scripts/src/**/*.js"],
			rules: {
				"@typescript-eslint/no-require-imports": "off",
				"@typescript-eslint/explicit-function-return-type": "off",
				"n/no-process-exit": "off",
			},
		},
		{
			// presets has no TS source — its tests are plain .mjs and use JSDoc for types
			files: ["packages/presets/test/**/*.mjs"],
			rules: {
				"@typescript-eslint/explicit-function-return-type": "off",
			},
		},
	],
};

/** @type {import('eslint').Linter.Config[]} */
export default defineConfig(config);
