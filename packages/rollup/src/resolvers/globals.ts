import type { GlobalsOption } from "rollup";

/**
 * Merges two `GlobalsOption` object maps, with `override` taking precedence over `base`.
 *
 * - Both `undefined` → `undefined`
 * - One `undefined`  → the other is returned as-is
 * - Both objects     → spread merged (`override` wins on conflicts)
 *
 * The function form of `GlobalsOption` is not supported for merging.
 * If you need dynamic global resolution, use the `output` escape hatch
 * in {@link FormatOutputOptions} to pass raw Rollup output options directly.
 *
 * @param base     - The shared (top-level) globals map.
 * @param override - The format-level globals map that takes precedence.
 * @returns A merged `GlobalsOption`, or `undefined` when both inputs are `undefined`.
 */
export function mergeGlobals(
	base: GlobalsOption | undefined,
	override: GlobalsOption | undefined,
): GlobalsOption | undefined {
	if (!base && !override) return undefined;
	if (!base) return override;
	if (!override) return base;

	if (typeof base === "function" || typeof override === "function") {
		return override ?? base;
	}

	return { ...base, ...override };
}
