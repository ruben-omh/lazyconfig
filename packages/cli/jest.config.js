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
			// Type-only module. Anchored so it does not also match the compile script at
			// src/commands/compile/sub-commands/scripts/types.ts, which does carry logic.
			"src/types\\.ts$",
		],
	},
};

/** @type {import('jest').Config} */
export default defineConfig(config);
