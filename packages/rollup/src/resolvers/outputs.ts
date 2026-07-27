import type { GlobalsOption, OutputOptions } from "rollup";
import type { BundleOptions, FormatOutputOptions, SupportedFormat } from "../types";
import { DEFAULT_FORMAT_EXTENSION, FORMAT_EXPORTS, NAME_REQUIRED_FORMATS } from "../constants";

/**
 * Builds the output file path for a given format.
 *
 * Filename patterns:
 * - `es` / `cjs`                       → `<outputDir>/<file>.<ext>`
 * - `umd` / `iife` / `amd` / `system`  → `<outputDir>/<file>.<format>.<ext>`
 *
 * The `ext` parameter overrides the format default (from {@link DEFAULT_FORMAT_EXTENSION}).
 * Provide it without a leading dot. Leading/trailing slashes in `outputDir` are stripped.
 *
 * @example
 * getOutputFile("es",  "my-lib", "dist")          // "dist/my-lib.mjs"
 * getOutputFile("umd", "my-lib", "dist")          // "dist/my-lib.umd.js"
 * getOutputFile("es",  "my-lib", "dist", "js")    // "dist/my-lib.js"
 * getOutputFile("umd", "my-lib", "dist", "min.js") // "dist/my-lib.umd.min.js"
 */
function getOutputFile(
	format: SupportedFormat,
	file: string,
	outputDir: string,
	ext?: string,
): string {
	const dir = outputDir.trim().replaceAll(/^\.?\/+|\/+$/g, "");
	const resolvedExt = ext ?? DEFAULT_FORMAT_EXTENSION[format];
	const base = format === "es" || format === "cjs" ? file : `${file}.${format}`;
	return `${dir}/${base}.${resolvedExt}`;
}

/**
 * Builds the `OutputOptions` for a single format output item.
 *
 * Merge precedence (highest → lowest):
 * 1. `formatItem.output` — raw format-level output overrides
 * 2. Format defaults (`exports: "auto"` for CJS / UMD / IIFE / AMD)
 * 3. Bundle-level shared options (`sourcemap`, `banner`, `footer`)
 *
 * The output `file` path is derived from `bundle.file`, `bundle.outputDir`,
 * and `formatItem.ext` via {@link getOutputFile}.
 *
 * @param format     - The Rollup output format to produce (e.g. `"es"`, `"umd"`).
 * @param formatItem - The resolved per-format output options for this specific output.
 * @param bundle     - The parent bundle options providing `file`, `outputDir`, `name`, etc.
 * @param globals    - The merged globals map (shared + format-level). Only applied to UMD and IIFE outputs.
 * @returns A fully composed Rollup `OutputOptions` object.
 */
export function resolveOutputOptions(
	format: SupportedFormat,
	formatItem: FormatOutputOptions,
	bundle: BundleOptions,
	globals: GlobalsOption | undefined,
): OutputOptions {
	const { file = "bundle", outputDir = "dist", name, sourcemap = false, banner, footer } = bundle;

	const requiresName = NAME_REQUIRED_FORMATS.has(format);

	return {
		format,
		file: getOutputFile(format, file, outputDir, formatItem.ext),
		...(globals !== undefined && requiresName ? { globals } : {}),
		...(requiresName && name ? { name } : {}),
		...(sourcemap === false ? {} : { sourcemap }),
		...(banner === undefined ? {} : { banner }),
		...(footer === undefined ? {} : { footer }),
		...(FORMAT_EXPORTS[format] ? { exports: FORMAT_EXPORTS[format] } : {}),
		...formatItem.output,
	};
}
