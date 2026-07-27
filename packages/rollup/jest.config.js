/** @type {import('jest').Config} */
const config = {
	verbose: true,
	testEnvironment: "node",
	testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/dist/", "<rootDir>/out-tsc/"],
	transform: {
		"^.+\\.[jt]sx?$": ["@swc/jest", { jsc: { target: "es2022" }, module: { type: "commonjs" } }],
	},
	moduleNameMapper: { "^(\\.{1,2}/.*)\\.js$": "$1" },
	collectCoverage: true,
	coverageProvider: "v8",
	coverageReporters: ["text", "lcov"],
	collectCoverageFrom: [
		"src/**/*.[jt]s?(x)",
		"!src/index.*",
		"!src/**/index.*",
		"!src/**/types.*",
		"!src/**/__tests__/**",
		"!src/**/?(*.)+(spec|test).[jt]s?(x)",
		"!test/**/*",
	],
	reporters: [
		"default",
		[
			"jest-junit",
			{
				outputDirectory: "reports/unit",
				outputName: "test-results.xml",
				suiteName: "LazyConfig Rollup test suite",
			},
		],
	],
};

export default config;
