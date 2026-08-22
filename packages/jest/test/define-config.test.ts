import { defineConfig } from "../src/define-config";

describe("defineConfig", () => {
	describe("defaults", () => {
		it("sets verbose to true", () => {
			expect(defineConfig().verbose).toBe(true);
		});

		it("sets testEnvironment to node", () => {
			expect(defineConfig().testEnvironment).toBe("node");
		});

		it("ignores node_modules, dist, and out-tsc from test discovery", () => {
			expect(defineConfig().testPathIgnorePatterns).toEqual([
				"<rootDir>/node_modules/",
				"<rootDir>/dist/",
				"<rootDir>/out-tsc/",
			]);
		});

		it("does not set a transform", () => {
			expect(defineConfig().transform).toBeUndefined();
		});

		it("does not collect coverage", () => {
			expect(defineConfig().collectCoverage).toBeUndefined();
		});

		it("does not set reporters", () => {
			expect(defineConfig().reporters).toBeUndefined();
		});
	});

	describe("typescript", () => {
		it("adds @swc/jest transform targeting CommonJS when enabled", () => {
			const config = defineConfig({ typescript: true });
			expect(config.transform).toEqual({
				"^.+\\.[jt]sx?$": [
					"@swc/jest",
					{ jsc: { target: "es2022" }, module: { type: "commonjs" } },
				],
			});
		});

		it("does not set a transform when disabled", () => {
			expect(defineConfig({ typescript: false }).transform).toBeUndefined();
		});
	});

	describe("browser", () => {
		it("sets testEnvironment to jsdom when enabled", () => {
			expect(defineConfig({ browser: true }).testEnvironment).toBe("jsdom");
		});

		it("keeps testEnvironment as node when disabled", () => {
			expect(defineConfig({ browser: false }).testEnvironment).toBe("node");
		});
	});

	describe("coverage", () => {
		it("enables coverage collection when set to true", () => {
			const config = defineConfig({ coverage: true });
			expect(config.collectCoverage).toBe(true);
		});

		it("uses v8 provider", () => {
			expect(defineConfig({ coverage: true }).coverageProvider).toBe("v8");
		});

		it("reports text and lcov formats", () => {
			expect(defineConfig({ coverage: true }).coverageReporters).toEqual(["text", "lcov"]);
		});

		it("sets collectCoverageFrom to src source files", () => {
			expect(defineConfig({ coverage: true }).collectCoverageFrom).toEqual([
				"src/**/*.[jt]s?(x)",
				"!src/index.*",
				"!src/**/index.*",
				"!src/**/*.d.ts",
				"!src/**/__tests__/**",
				"!src/**/?(*.)+(spec|test).[jt]s?(x)",
				"!test/**/*",
			]);
		});

		it("does not set coverageThreshold when set to true", () => {
			expect(defineConfig({ coverage: true }).coverageThreshold).toBeUndefined();
		});

		it("sets coverageThreshold when thresholds are provided", () => {
			const config = defineConfig({ coverage: { lines: 80, branches: 75 } });
			expect(config.coverageThreshold).toEqual({ global: { lines: 80, branches: 75 } });
		});

		it("accepts partial threshold config", () => {
			const config = defineConfig({ coverage: { statements: 90 } });
			expect(config.coverageThreshold).toEqual({ global: { statements: 90 } });
		});

		it("does not enable coverage when set to false", () => {
			expect(defineConfig({ coverage: false }).collectCoverage).toBeUndefined();
		});
	});

	describe("junit", () => {
		it("adds default and jest-junit reporters when set to true", () => {
			expect(defineConfig({ junit: true }).reporters).toEqual(["default", ["jest-junit", {}]]);
		});

		it("passes options to jest-junit reporter", () => {
			const config = defineConfig({
				junit: { outputDirectory: "reports", outputName: "results.xml" },
			});
			expect(config.reporters).toEqual([
				"default",
				["jest-junit", { outputDirectory: "reports", outputName: "results.xml" }],
			]);
		});

		it("does not set reporters when disabled", () => {
			expect(defineConfig({ junit: false }).reporters).toBeUndefined();
		});
	});

	describe("moduleNameMapper", () => {
		it("does not set moduleNameMapper when typescript is disabled and no mapper is provided", () => {
			expect(defineConfig().moduleNameMapper).toBeUndefined();
		});

		it("adds .js -> extensionless mapper automatically when typescript is enabled", () => {
			expect(defineConfig({ typescript: true }).moduleNameMapper).toEqual({
				"^(\\.{1,2}/.*)\\.js$": "$1",
			});
		});

		it("merges user-provided mapper with the automatic .js mapper", () => {
			const config = defineConfig({
				typescript: true,
				moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
			});
			expect(config.moduleNameMapper).toEqual({
				"^(\\.{1,2}/.*)\\.js$": "$1",
				"^@/(.*)$": "<rootDir>/src/$1",
			});
		});

		it("user-provided entries take precedence over automatic ones", () => {
			const override = { "^(\\.{1,2}/.*)\\.js$": "<rootDir>/custom/$1" };
			const config = defineConfig({ typescript: true, moduleNameMapper: override });
			expect(config.moduleNameMapper).toEqual(override);
		});

		it("sets moduleNameMapper when provided without typescript", () => {
			const mapper = { "^@/(.*)$": "<rootDir>/src/$1" };
			expect(defineConfig({ moduleNameMapper: mapper }).moduleNameMapper).toEqual(mapper);
		});
	});

	describe("extends", () => {
		it("merges additional config on top of generated config", () => {
			const config = defineConfig({ extends: { testTimeout: 10000 } });
			expect(config.testTimeout).toBe(10000);
		});

		it("overrides generated values when keys conflict", () => {
			const config = defineConfig({ extends: { verbose: false } });
			expect(config.verbose).toBe(false);
		});

		it("preserves generated values not present in extends", () => {
			const config = defineConfig({ typescript: true, extends: { testTimeout: 5000 } });
			expect(config.transform).toEqual({
				"^.+\\.[jt]sx?$": [
					"@swc/jest",
					{ jsc: { target: "es2022" }, module: { type: "commonjs" } },
				],
			});
		});
	});
});
