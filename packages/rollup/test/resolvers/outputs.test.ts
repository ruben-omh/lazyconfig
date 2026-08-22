import { resolveOutputOptions } from "../../src/resolvers/outputs";
import type { BundleOptions, FormatOutputOptions } from "../../src/types";

const bundle = (overrides: Partial<BundleOptions> = {}): BundleOptions => ({
	input: "src/index.ts",
	...overrides,
});

const item = (overrides: Partial<FormatOutputOptions> = {}): FormatOutputOptions => ({
	...overrides,
});

describe("resolveOutputOptions", () => {
	describe("file path", () => {
		it("uses default outputDir and file when not specified", () => {
			const result = resolveOutputOptions("es", item(), bundle(), undefined);
			expect(result.file).toBe("dist/bundle.mjs");
		});

		it("uses provided outputDir and file", () => {
			const result = resolveOutputOptions(
				"es",
				item(),
				bundle({ outputDir: "out", file: "my-lib" }),
				undefined,
			);
			expect(result.file).toBe("out/my-lib.mjs");
		});

		it("strips leading slash from outputDir", () => {
			const result = resolveOutputOptions("es", item(), bundle({ outputDir: "/dist" }), undefined);
			expect(result.file).toBe("dist/bundle.mjs");
		});

		it("strips trailing slash from outputDir", () => {
			const result = resolveOutputOptions("es", item(), bundle({ outputDir: "dist/" }), undefined);
			expect(result.file).toBe("dist/bundle.mjs");
		});

		it("strips leading ./ from outputDir", () => {
			const result = resolveOutputOptions("es", item(), bundle({ outputDir: "./dist" }), undefined);
			expect(result.file).toBe("dist/bundle.mjs");
		});

		it.each([["./"], [""], ["/"], ["   "]])(
			"falls back to the current directory for outputDir %p",
			(outputDir) => {
				const result = resolveOutputOptions("es", item(), bundle({ outputDir }), undefined);
				expect(result.file).toBe("./bundle.mjs");
			},
		);

		it("appends format segment for umd", () => {
			const result = resolveOutputOptions(
				"umd",
				item(),
				bundle({ file: "my-lib", name: "MyLib" }),
				undefined,
			);
			expect(result.file).toBe("dist/my-lib.umd.js");
		});

		it("appends format segment for iife", () => {
			const result = resolveOutputOptions(
				"iife",
				item(),
				bundle({ file: "my-lib", name: "MyLib" }),
				undefined,
			);
			expect(result.file).toBe("dist/my-lib.iife.js");
		});

		it("appends format segment for amd", () => {
			const result = resolveOutputOptions("amd", item(), bundle({ file: "my-lib" }), undefined);
			expect(result.file).toBe("dist/my-lib.amd.js");
		});

		it("appends format segment for system", () => {
			const result = resolveOutputOptions("system", item(), bundle({ file: "my-lib" }), undefined);
			expect(result.file).toBe("dist/my-lib.system.js");
		});

		it("uses ext override when provided", () => {
			const result = resolveOutputOptions(
				"es",
				item({ ext: "js" }),
				bundle({ file: "my-lib" }),
				undefined,
			);
			expect(result.file).toBe("dist/my-lib.js");
		});

		it("uses ext override for umd", () => {
			const result = resolveOutputOptions(
				"umd",
				item({ ext: "min.js" }),
				bundle({ file: "my-lib", name: "MyLib" }),
				undefined,
			);
			expect(result.file).toBe("dist/my-lib.umd.min.js");
		});
	});

	describe("format", () => {
		it("sets format correctly", () => {
			expect(resolveOutputOptions("es", item(), bundle(), undefined).format).toBe("es");
			expect(resolveOutputOptions("cjs", item(), bundle(), undefined).format).toBe("cjs");
		});
	});

	describe("globals", () => {
		it("applies globals to umd format", () => {
			const globals = { react: "React" };
			const result = resolveOutputOptions("umd", item(), bundle({ name: "MyLib" }), globals);
			expect(result.globals).toEqual(globals);
		});

		it("applies globals to iife format", () => {
			const globals = { react: "React" };
			const result = resolveOutputOptions("iife", item(), bundle({ name: "MyLib" }), globals);
			expect(result.globals).toEqual(globals);
		});

		it("does not apply globals to es format", () => {
			const result = resolveOutputOptions("es", item(), bundle(), { react: "React" });
			expect(result.globals).toBeUndefined();
		});

		it("does not apply globals to cjs format", () => {
			const result = resolveOutputOptions("cjs", item(), bundle(), { react: "React" });
			expect(result.globals).toBeUndefined();
		});

		it("does not apply globals to amd format", () => {
			const result = resolveOutputOptions("amd", item(), bundle(), { react: "React" });
			expect(result.globals).toBeUndefined();
		});

		it("does not apply globals to system format", () => {
			const result = resolveOutputOptions("system", item(), bundle(), { react: "React" });
			expect(result.globals).toBeUndefined();
		});

		it("omits globals key when undefined", () => {
			const result = resolveOutputOptions("umd", item(), bundle({ name: "MyLib" }), undefined);
			expect("globals" in result).toBe(false);
		});
	});

	describe("name", () => {
		it("includes name for umd when provided", () => {
			const result = resolveOutputOptions("umd", item(), bundle({ name: "MyLib" }), undefined);
			expect(result.name).toBe("MyLib");
		});

		it("includes name for iife when provided", () => {
			const result = resolveOutputOptions("iife", item(), bundle({ name: "MyLib" }), undefined);
			expect(result.name).toBe("MyLib");
		});

		it("omits name for es format", () => {
			const result = resolveOutputOptions("es", item(), bundle({ name: "MyLib" }), undefined);
			expect("name" in result).toBe(false);
		});

		it("omits name for cjs format", () => {
			const result = resolveOutputOptions("cjs", item(), bundle({ name: "MyLib" }), undefined);
			expect("name" in result).toBe(false);
		});
	});

	describe("sourcemap", () => {
		it("omits sourcemap when false", () => {
			const result = resolveOutputOptions("es", item(), bundle({ sourcemap: false }), undefined);
			expect("sourcemap" in result).toBe(false);
		});

		it("includes sourcemap when true", () => {
			const result = resolveOutputOptions("es", item(), bundle({ sourcemap: true }), undefined);
			expect(result.sourcemap).toBe(true);
		});

		it("includes sourcemap when inline", () => {
			const result = resolveOutputOptions("es", item(), bundle({ sourcemap: "inline" }), undefined);
			expect(result.sourcemap).toBe("inline");
		});
	});

	describe("banner and footer", () => {
		it("includes banner when provided", () => {
			const result = resolveOutputOptions("es", item(), bundle({ banner: "/* MIT */" }), undefined);
			expect(result.banner).toBe("/* MIT */");
		});

		it("omits banner when not provided", () => {
			const result = resolveOutputOptions("es", item(), bundle(), undefined);
			expect("banner" in result).toBe(false);
		});

		it("includes footer when provided", () => {
			const result = resolveOutputOptions("es", item(), bundle({ footer: "/* end */" }), undefined);
			expect(result.footer).toBe("/* end */");
		});

		it("omits footer when not provided", () => {
			const result = resolveOutputOptions("es", item(), bundle(), undefined);
			expect("footer" in result).toBe(false);
		});
	});

	describe("exports", () => {
		it("sets exports to auto for cjs", () => {
			expect(resolveOutputOptions("cjs", item(), bundle(), undefined).exports).toBe("auto");
		});

		it("sets exports to auto for umd", () => {
			expect(
				resolveOutputOptions("umd", item(), bundle({ name: "MyLib" }), undefined).exports,
			).toBe("auto");
		});

		it("omits exports for es", () => {
			expect("exports" in resolveOutputOptions("es", item(), bundle(), undefined)).toBe(false);
		});

		it("omits exports for system", () => {
			expect("exports" in resolveOutputOptions("system", item(), bundle(), undefined)).toBe(false);
		});
	});

	describe("formatItem.output override", () => {
		it("allows raw output options to override computed values", () => {
			const result = resolveOutputOptions(
				"es",
				item({ output: { intro: "/* intro */" } }),
				bundle(),
				undefined,
			);
			expect(result.intro).toBe("/* intro */");
		});
	});
});
