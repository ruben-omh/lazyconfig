import type { Config } from "jest";
import type { DefineConfigOptions, JunitOptions } from "./types";

/**
 * Builds a Jest `Config` object from a set of opt-in feature flags.
 *
 * Sensible defaults are always applied:
 * - `verbose: true` for detailed test output
 * - `testEnvironment: 'node'` unless `browser` is enabled
 * - `testPathIgnorePatterns` excluding `node_modules/`, `dist/`, and `out-tsc/`
 *
 * @param options - Feature flags and overrides. All options are optional.
 * @returns A Jest `Config` object ready to be used as a default export in `jest.config.ts`.
 *
 * @example
 * // Minimal — JavaScript project, no extra dependencies required
 * export default defineConfig();
 *
 * @example
 * // TypeScript project
 * export default defineConfig({ typescript: true });
 *
 * @example
 * // TypeScript + browser environment + coverage thresholds + JUnit reporting
 * export default defineConfig({
 *   typescript: true,
 *   browser: true,
 *   coverage: { lines: 80, branches: 75, functions: 80, statements: 80 },
 *   junit: { outputDirectory: 'reports', outputName: 'test-results.xml' },
 * });
 */
export function defineConfig(options: DefineConfigOptions = {}): Config {
	const {
		typescript = false,
		browser = false,
		coverage = false,
		junit = false,
		moduleNameMapper,
		extends: overrides,
	} = options;

	const config: Config = {
		verbose: true,
		testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/dist/", "<rootDir>/out-tsc/"],
	};

	if (typescript) {
		config.transform = {
			"^.+\\.[jt]sx?$": ["@swc/jest", { jsc: { target: "es2022" }, module: { type: "commonjs" } }],
		};
	}

	config.testEnvironment = browser ? "jsdom" : "node";

	if (coverage) {
		config.collectCoverage = true;
		config.coverageProvider = "v8";
		config.coverageReporters = ["text", "lcov"];
		config.collectCoverageFrom = [
			"src/**/*.[jt]s?(x)",
			"!src/index.*",
			"!src/**/index.*",
			"!src/**/types.*",
			"!src/**/__tests__/**",
			"!src/**/?(*.)+(spec|test).[jt]s?(x)",
			"!test/**/*",
		];

		if (typeof coverage === "object") {
			config.coverageThreshold = { global: coverage };
		}
	}

	if (junit) {
		const junitOptions: JunitOptions = typeof junit === "object" ? junit : {};
		config.reporters = ["default", ["jest-junit", junitOptions as Record<string, unknown>]];
	}

	const resolvedMapper = {
		// Strips .js extensions from relative imports so Jest resolves .ts source files correctly.
		// Required when TypeScript ESM source files use .js extensions in their import paths.
		...(typescript ? { "^(\\.{1,2}/.*)\\.js$": "$1" } : {}),
		...moduleNameMapper,
	};

	if (Object.keys(resolvedMapper).length > 0) {
		config.moduleNameMapper = resolvedMapper;
	}

	return { ...config, ...overrides };
}
