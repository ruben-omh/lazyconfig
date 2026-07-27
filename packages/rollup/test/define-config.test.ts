import type { OutputOptions } from "rollup";
import { defineConfig } from "../src/define-config";
import type { DefineConfigOptions } from "../src/types";

const output = (config: ReturnType<typeof defineConfig>[number]): OutputOptions =>
	config.output as OutputOptions;

// --- helpers ---

const base = (overrides: Partial<DefineConfigOptions> = {}): DefineConfigOptions => ({
	bundles: [{ input: "src/index.ts", file: "my-lib", name: "MyLib" }],
	...overrides,
});

// --- tests ---

describe("defineConfig", () => {
	describe("defaults", () => {
		it("returns a non-empty array", () => {
			expect(defineConfig(base()).length).toBeGreaterThan(0);
		});

		it("emits one config for es format by default", () => {
			const configs = defineConfig(base());
			expect(configs).toHaveLength(1);
			expect(configs[0]?.output).toMatchObject({ format: "es" });
		});

		it("does not emit cjs by default", () => {
			const configs = defineConfig(base());
			expect(configs.every((c) => output(c).format !== "cjs")).toBe(true);
		});
	});

	describe("formats", () => {
		it("emits es when enabled", () => {
			const configs = defineConfig(base({ formats: { es: true } }));
			expect(configs.some((c) => output(c).format === "es")).toBe(true);
		});

		it("emits cjs when enabled", () => {
			const configs = defineConfig(base({ formats: { cjs: true } }));
			expect(configs.some((c) => output(c).format === "cjs")).toBe(true);
		});

		it("emits umd when enabled and name is provided", () => {
			const configs = defineConfig(base({ formats: { es: false, umd: true } }));
			expect(configs.some((c) => output(c).format === "umd")).toBe(true);
		});

		it("skips umd with a warning when name is missing", () => {
			const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
			const configs = defineConfig({
				bundles: [{ input: "src/index.ts", file: "my-lib" }],
				formats: { es: false, umd: true },
			});
			expect(configs).toHaveLength(0);
			expect(warn).toHaveBeenCalledWith(expect.stringContaining('"umd"'));
			warn.mockRestore();
		});

		it("skips iife with a warning when name is missing", () => {
			const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
			defineConfig({
				bundles: [{ input: "src/index.ts", file: "my-lib" }],
				formats: { es: false, iife: true },
			});
			expect(warn).toHaveBeenCalledWith(expect.stringContaining('"iife"'));
			warn.mockRestore();
		});

		it("disables es when explicitly set to false", () => {
			const configs = defineConfig(base({ formats: { es: false } }));
			expect(configs.every((c) => output(c).format !== "es")).toBe(true);
		});

		it("produces one output when format config is a single object", () => {
			const configs = defineConfig(
				base({
					formats: { es: false, cjs: { ext: "cjs" } },
				}),
			);
			const cjsConfigs = configs.filter((c) => output(c).format === "cjs");
			expect(cjsConfigs).toHaveLength(1);
		});

		it("produces multiple outputs for array format config", () => {
			const configs = defineConfig(
				base({
					formats: {
						es: false,
						umd: [{ ext: "umd.dev.js" }, { ext: "umd.prod.js" }],
					},
				}),
			);
			const umdConfigs = configs.filter((c) => output(c).format === "umd");
			expect(umdConfigs).toHaveLength(2);
		});
	});

	describe("bundles", () => {
		it("produces configs for each bundle", () => {
			const configs = defineConfig({
				bundles: [
					{ input: "src/index.ts", file: "lib" },
					{ input: "src/cli.ts", file: "cli" },
				],
			});
			expect(configs).toHaveLength(2);
		});

		it("uses bundle input as rollup input", () => {
			const configs = defineConfig(base());
			expect(configs[0]?.input).toBe("src/index.ts");
		});
	});

	describe("external", () => {
		it("sets external on the rollup config", () => {
			const configs = defineConfig(base({ external: ["react"] }));
			expect(configs[0]?.external).toContain("react");
		});

		it("auto-externalizes globals keys", () => {
			const configs = defineConfig(
				base({
					formats: { es: false, umd: true },
					globals: { react: "React" },
				}),
			);
			const external = configs[0]?.external as string[];
			expect(external).toContain("react");
		});

		it("omits external key when nothing is external", () => {
			const configs = defineConfig(base());
			expect("external" in configs[0]).toBe(false);
		});
	});

	describe("globals", () => {
		it("passes globals to umd output", () => {
			const configs = defineConfig(
				base({
					formats: { es: false, umd: true },
					globals: { react: "React" },
				}),
			);
			expect(output(configs[0]).globals).toEqual({ react: "React" });
		});

		it("does not pass globals to es output", () => {
			const configs = defineConfig(base({ globals: { react: "React" } }));
			expect(output(configs[0]).globals).toBeUndefined();
		});
	});

	describe("omitFormats", () => {
		it("excludes the specified format for a bundle", () => {
			const configs = defineConfig({
				bundles: [{ input: "src/index.ts", file: "my-lib", omitFormats: ["es"] }],
			});
			expect(configs.every((c) => output(c).format !== "es")).toBe(true);
		});

		it("only excludes the format for the bundle that declares it", () => {
			const configs = defineConfig({
				bundles: [
					{ input: "src/index.ts", file: "lib" },
					{ input: "src/cli.ts", file: "cli", omitFormats: ["es"] },
				],
			});
			const libConfigs = configs.filter((c) => c.input === "src/index.ts");
			const cliConfigs = configs.filter((c) => c.input === "src/cli.ts");
			expect(libConfigs.some((c) => output(c).format === "es")).toBe(true);
			expect(cliConfigs.every((c) => output(c).format !== "es")).toBe(true);
		});

		it("can exclude multiple formats", () => {
			const configs = defineConfig({
				bundles: [
					{
						input: "src/index.ts",
						file: "my-lib",
						omitFormats: ["es", "cjs"],
					},
				],
				formats: { es: true, cjs: true },
			});
			expect(configs).toHaveLength(0);
		});
	});

	describe("passthrough options", () => {
		it("forwards treeshake to rollup config", () => {
			const configs = defineConfig(base({ treeshake: "smallest" }));
			expect(configs[0]?.treeshake).toBe("smallest");
		});

		it("forwards onwarn to rollup config", () => {
			const onwarn = jest.fn();
			const configs = defineConfig(base({ onwarn }));
			expect(configs[0]?.onwarn).toBe(onwarn);
		});

		it("omits treeshake when not provided", () => {
			const configs = defineConfig(base());
			expect("treeshake" in configs[0]).toBe(false);
		});
	});
});
