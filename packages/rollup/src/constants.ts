import type { ModuleFormat } from "rollup";
import type { SupportedFormat } from "./types";

/** All supported formats in pipeline order. */
export const SUPPORTED_FORMATS: SupportedFormat[] = ["es", "cjs", "umd", "iife", "amd", "system"];

/**
 * File extensions processed by `@rollup/plugin-babel` and `@rollup/plugin-node-resolve`.
 * Kept in sync so both plugins resolve and transform the same file types.
 */
export const DEFAULT_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"];

/** Rollup formats that require a `name` global variable to function correctly. */
export const NAME_REQUIRED_FORMATS = new Set<ModuleFormat>(["umd", "iife"]);

/**
 * Default output file extension for each supported format.
 *
 * - `es`     → `.mjs`
 * - `cjs`    → `.cjs`
 * - `umd` / `iife` / `amd` / `system` → `.js`
 */
export const DEFAULT_FORMAT_EXTENSION: Record<SupportedFormat, string> = {
	es: "mjs",
	cjs: "cjs",
	umd: "js",
	iife: "js",
	amd: "js",
	system: "js",
};

/**
 * Default `exports` mode for formats that benefit from `"auto"`.
 * ESM and SystemJS omit this — Rollup handles them correctly without it.
 */
export const FORMAT_EXPORTS: Partial<Record<SupportedFormat, "auto">> = {
	cjs: "auto",
	umd: "auto",
	iife: "auto",
	amd: "auto",
};
