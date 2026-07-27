import type { ExternalOption, GlobalsOption } from "rollup";

/**
 * Extracts the string keys from a `GlobalsOption` object map.
 * Returns an empty array when `globals` is a function — module IDs cannot
 * be derived from a resolver function without calling it for every possible ID.
 */
function extractGlobalsKeys(globals: GlobalsOption | undefined): string[] {
	if (!globals || typeof globals === "function") return [];
	return Object.keys(globals);
}

/**
 * Merges two `ExternalOption` values additively — an ID is external if either side matches it.
 *
 * - Both `undefined`    → `undefined`
 * - One `undefined`     → the other is returned as-is
 * - Either is function  → no merging, `override` takes precedence over `base`
 * - Both non-functions  → unioned into a single array (strings deduped, RegExps kept)
 *
 * The function form is not merged because wrapping two external functions produces
 * complex, hard-to-debug behaviour for an edge case that rarely occurs in practice.
 * If both sides need to be active, use the `output` escape hatch in
 * {@link FormatOutputOptions} to pass raw Rollup output options directly.
 */
function mergeExternalOptions(
	base: ExternalOption | undefined,
	override: ExternalOption | undefined,
): ExternalOption | undefined {
	if (!base && !override) return undefined;
	if (!base) return override;
	if (!override) return base;

	// Function form — no merging, prefer override
	if (typeof base === "function" || typeof override === "function") return override ?? base;

	// Both non-functions — union into an array, deduplicating strings
	const baseArr = Array.isArray(base) ? base : [base];
	const overrideArr = Array.isArray(override) ? override : [override];
	const existingStrings = new Set(baseArr.filter((x): x is string => typeof x === "string"));
	const newItems = overrideArr.filter((x) => typeof x !== "string" || !existingStrings.has(x));

	return [...baseArr, ...newItems];
}

/**
 * Resolves the final `external` option for a Rollup config by merging three sources:
 *
 * 1. `shared`      — from `DefineConfigOptions.external` (baseline for all formats)
 * 2. `formatLevel` — from `FormatOutputOptions.external` (additive, format-level additions)
 * 3. `globals`     — object keys are always externalized automatically
 *
 * All sources are additive — a module is external if any layer matches it.
 * Returns `undefined` when nothing is external, so the key is omitted from the Rollup config.
 *
 * @param shared      - The `external` value from `DefineConfigOptions`.
 * @param formatLevel - The `external` value from `FormatOutputOptions`.
 * @param globals     - The merged globals map (shared + format-level).
 */
export function resolveExternal(
	shared: ExternalOption | undefined,
	formatLevel: ExternalOption | undefined,
	globals: GlobalsOption | undefined,
): ExternalOption | undefined {
	const globalsKeys = extractGlobalsKeys(globals);
	const globalsExternal: ExternalOption | undefined =
		globalsKeys.length > 0 ? globalsKeys : undefined;

	const userExternal = mergeExternalOptions(shared, formatLevel);
	return mergeExternalOptions(userExternal, globalsExternal);
}
