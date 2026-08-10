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
};

/** @type {import('jest').Config} */
export default defineConfig(config);
