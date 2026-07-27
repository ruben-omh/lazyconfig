import type { Linter } from "eslint";
import { defineConfig, DEFAULT_IGNORE_PATTERNS } from "../src";
import { prettier } from "../src/configs/prettier";

const prettierPreset = prettier();

// --- helpers ---

const findByRule = (config: Linter.Config[], rule: string): Linter.Config | undefined =>
	config.find((c) => c.rules !== undefined && rule in c.rules);

const findIgnoresEntry = (config: Linter.Config[]): Linter.Config | undefined =>
	config.find((c) => c.ignores !== undefined && Object.keys(c).length === 1);

const findByPlugin = (config: Linter.Config[], plugin: string): Linter.Config | undefined =>
	config.find((c) => c.plugins !== undefined && plugin in c.plugins);

// --- tests ---

describe("defineConfig", () => {
	describe("defaults", () => {
		it("returns a non-empty config array", () => {
			expect(defineConfig().length).toBeGreaterThan(0);
		});

		it("always includes base rules", () => {
			expect(findByRule(defineConfig(), "no-console")).toBeDefined();
		});

		it("does not include global ignore patterns by default", () => {
			expect(findIgnoresEntry(defineConfig())).toBeUndefined();
		});

		it("does not include typescript rules by default", () => {
			expect(findByRule(defineConfig(), "@typescript-eslint/no-unused-vars")).toBeUndefined();
		});

		it("does not include react plugin by default", () => {
			expect(findByPlugin(defineConfig(), "react")).toBeUndefined();
		});

		it("does not include node plugin by default", () => {
			expect(findByPlugin(defineConfig(), "n")).toBeUndefined();
		});
	});

	describe("ignores", () => {
		it("adds global ignore patterns when set to true", () => {
			const entry = findIgnoresEntry(defineConfig({ ignores: true }));
			expect(entry?.ignores).toEqual(DEFAULT_IGNORE_PATTERNS);
		});

		it("places ignores before base", () => {
			const config = defineConfig({ ignores: true });
			const ignoresIdx = config.findIndex(
				(c) => c.ignores !== undefined && Object.keys(c).length === 1,
			);
			const baseIdx = config.findIndex((c) => c.rules?.["no-console"] !== undefined);
			expect(ignoresIdx).toBeLessThan(baseIdx);
		});

		it("merges extra patterns with defaults when an array is provided", () => {
			const config = defineConfig({ ignores: ["**/storybook-static/**"] });
			const entry = findIgnoresEntry(config);
			expect(entry?.ignores).toEqual([...DEFAULT_IGNORE_PATTERNS, "**/storybook-static/**"]);
		});

		it("places merged ignores first", () => {
			const config = defineConfig({ ignores: ["**/custom/**"] });
			expect(config[0]).toEqual({ ignores: [...DEFAULT_IGNORE_PATTERNS, "**/custom/**"] });
		});

		it("does not add ignores when not set", () => {
			expect(findIgnoresEntry(defineConfig({ typescript: true }))).toBeUndefined();
		});
	});

	describe("typescript", () => {
		it("adds typescript rules when enabled", () => {
			expect(
				findByRule(defineConfig({ typescript: true }), "@typescript-eslint/no-unused-vars"),
			).toBeDefined();
		});

		it("does not add typescript rules when disabled", () => {
			expect(findByRule(defineConfig(), "@typescript-eslint/no-unused-vars")).toBeUndefined();
		});

		it("comes after base", () => {
			const config = defineConfig({ typescript: true });
			const baseIdx = config.findIndex((c) => c.rules?.["no-console"] !== undefined);
			const tsIdx = config.findIndex(
				(c) => c.rules?.["@typescript-eslint/no-unused-vars"] !== undefined,
			);
			expect(tsIdx).toBeGreaterThan(baseIdx);
		});
	});

	describe("react", () => {
		it("adds react plugin when enabled", () => {
			expect(findByPlugin(defineConfig({ react: true }), "react")).toBeDefined();
		});

		it("adds react-hooks plugin when enabled", () => {
			expect(findByPlugin(defineConfig({ react: true }), "react-hooks")).toBeDefined();
		});

		it("does not add react plugin when disabled", () => {
			expect(findByPlugin(defineConfig(), "react")).toBeUndefined();
		});
	});

	describe("a11y", () => {
		it("adds jsx-a11y plugin when enabled", () => {
			expect(findByPlugin(defineConfig({ react: true, a11y: true }), "jsx-a11y")).toBeDefined();
		});

		it("does not add jsx-a11y plugin when disabled", () => {
			expect(findByPlugin(defineConfig({ react: true }), "jsx-a11y")).toBeUndefined();
		});

		it("warns when enabled without react", () => {
			const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
			defineConfig({ a11y: true });
			expect(warn).toHaveBeenCalledWith(
				expect.stringContaining("a11y preset is intended to be used alongside react: true"),
			);
			warn.mockRestore();
		});

		it("does not warn when enabled with react", () => {
			const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
			defineConfig({ react: true, a11y: true });
			expect(warn).not.toHaveBeenCalled();
			warn.mockRestore();
		});
	});

	describe("node", () => {
		it("adds node plugin when enabled", () => {
			expect(findByPlugin(defineConfig({ node: true }), "n")).toBeDefined();
		});

		it("adds node-specific rules when enabled", () => {
			expect(findByRule(defineConfig({ node: true }), "n/no-deprecated-api")).toBeDefined();
		});

		it("does not add node plugin when disabled", () => {
			expect(findByPlugin(defineConfig(), "n")).toBeUndefined();
		});
	});

	describe("prettier", () => {
		it("is placed last when enabled", () => {
			const config = defineConfig({ typescript: true, node: true, prettier: true });
			expect(config.slice(-prettierPreset.length)).toEqual(prettierPreset);
		});

		it("comes after extends entries", () => {
			const custom = { rules: { "no-console": "off" as const } };
			const config = defineConfig({ prettier: true, extends: [custom] });
			const customIdx = config.indexOf(custom);
			const prettierIdx = config.length - prettierPreset.length;
			expect(customIdx).toBeLessThan(prettierIdx);
		});
	});

	describe("extends", () => {
		it("adds custom config entries to the array", () => {
			const custom = { rules: { "no-console": "off" as const } };
			expect(defineConfig({ extends: [custom] })).toContain(custom);
		});

		it("places custom entries after presets", () => {
			const custom = { rules: { "no-console": "off" as const } };
			const config = defineConfig({ typescript: true, extends: [custom] });
			const tsIdx = config.findIndex(
				(c) => c.rules?.["@typescript-eslint/no-unused-vars"] !== undefined,
			);
			expect(config.indexOf(custom)).toBeGreaterThan(tsIdx);
		});

		it("places custom entries before prettier", () => {
			const custom = { rules: { "no-console": "off" as const } };
			const config = defineConfig({ prettier: true, extends: [custom] });
			const customIdx = config.indexOf(custom);
			const prettierIdx = config.length - prettierPreset.length;
			expect(customIdx).toBeLessThan(prettierIdx);
		});

		it("does not add entries when extends is empty", () => {
			expect(defineConfig({ extends: [] })).toEqual(defineConfig());
		});
	});
});
