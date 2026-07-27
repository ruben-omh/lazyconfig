import { defineConfig } from "@lazyconfig/jest";

/** @type {import('@lazyconfig/jest').DefineConfigOptions} */
const config = {
	coverage: true,
	typescript: true,
	junit: {
		outputDirectory: "reports/unit",
		outputName: "test-results.xml",
		suiteName: "LazyConfig CLI test suite",
	},
	extends: {
		coveragePathIgnorePatterns: [
			"src/cli.ts",
			"src/commands/.+/command.ts",
			"src/commands/.+/sub-commands/.+.command.ts",
		],
	},
};

/** @type {import('jest').Config} */
export default defineConfig(config);
