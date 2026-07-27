import type { Config } from "jest";

/**
 * Per-metric coverage thresholds enforced globally across the project.
 * Each value is a percentage (0–100). Tests will fail if any metric falls below its threshold.
 */
export interface CoverageThresholds {
	/** Minimum percentage of lines that must be covered. */
	lines?: number;
	/** Minimum percentage of branches (if/else, ternary, etc.) that must be covered. */
	branches?: number;
	/** Minimum percentage of functions that must be covered. */
	functions?: number;
	/** Minimum percentage of statements that must be covered. */
	statements?: number;
}

/**
 * Options for the `jest-junit` XML reporter.
 * Passed directly to `jest-junit` when `junit` is enabled.
 */
export interface JunitOptions {
	/**
	 * Directory to write the XML report to.
	 * @default '.'
	 */
	outputDirectory?: string;
	/**
	 * XML report filename.
	 * @default 'junit.xml'
	 */
	outputName?: string;
	/**
	 * Name of the root `<testsuites>` element.
	 * @default 'jest tests'
	 */
	suiteName?: string;
	/**
	 * Separator used between ancestor suite names in the `classname` attribute.
	 * @default ' > '
	 */
	ancestorSeparator?: string;
}

export interface DefineConfigOptions {
	/**
	 * Enable TypeScript transformation via @swc/jest.
	 * Requires `@swc/jest` and `@swc/core` to be installed.
	 * @default false
	 */
	typescript?: boolean;
	/**
	 * Enable browser-like testing with jsdom environment.
	 * Requires `jest-environment-jsdom` to be installed.
	 * @default false
	 */
	browser?: boolean;
	/**
	 * Enable coverage collection.
	 * - `true` enables coverage with default settings.
	 * - An object sets per-metric thresholds (0–100).
	 * @default false
	 */
	coverage?: boolean | CoverageThresholds;
	/**
	 * Enable JUnit XML reporter via `jest-junit`.
	 * Requires `jest-junit` to be installed.
	 * - `true` uses default output settings.
	 * - An object allows customizing the report output.
	 * @default false
	 */
	junit?: boolean | JunitOptions;
	/**
	 * Module name mapper entries for path aliases.
	 * Maps directly to Jest's `moduleNameMapper`.
	 * @example { '^@/(.*)$': '<rootDir>/src/$1' }
	 */
	moduleNameMapper?: Record<string, string>;
	/**
	 * Additional Jest config to merge. Keys in this object take precedence
	 * over the generated config.
	 */
	extends?: Config;
}
