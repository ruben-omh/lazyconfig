import { defineConfig } from "@lazyconfig/jest";

/** @type {import('@lazyconfig/jest').DefineConfigOptions} */
const config = {
	coverage: true,
	typescript: true,
	junit: {
		outputDirectory: "reports/unit",
		outputName: "test-results.xml",
		suiteName: "LazyConfig ESLint test suite",
	},
	extends: {
		moduleNameMapper: {
			"^eslint-plugin-n$": "<rootDir>/test/__mocks__/eslint-plugin-n.js",
		},
	},
};

/** @type {import('jest').Config} */
export default defineConfig(config);
