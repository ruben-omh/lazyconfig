// DUPLICATED, DELIBERATELY — the twin lives at packages/rollup/src/helpers/require-peer.ts.
//
// @lazyconfig/eslint and @lazyconfig/rollup publish independently, so sharing this would
// mean either a third published package or a private devDependency inlined by both rollup
// and api-extractor's `bundledPackages`. Neither is worth it for ~40 lines, and both would
// add a runtime dependency to presets that are otherwise dependency-free.
//
// The public signatures differ on purpose (this one names a preset, the rollup one names a
// plugin), but `isResolveFailureFor` is shared logic: change it here, change it there too.

import { createRequire } from "node:module";

// `NodeRequire` from the global @types/node namespace is deprecated; the
// inferred return type of `createRequire` is the documented replacement.
export type PeerRequire = ReturnType<typeof createRequire>;

const defaultRequire: PeerRequire = createRequire(import.meta.url);

// Duck-type rather than `instanceof Error` — Jest's resolver throws from its
// own VM realm, so the cross-realm error fails `instanceof Error` even though
// it carries the expected `.message` and `.code` fields.
//
// Only `require.resolve` errors flow through here. `require.resolve` does not
// trigger transitive loads, so a substring check on the specifier is a safe
// confirmation that the missing module is the one we asked for.
function isResolveFailureFor(error: unknown, specifier: string): boolean {
	if (typeof error !== "object" || error === null) return false;
	const e = error as { code?: unknown; message?: unknown };
	if (e.code !== "MODULE_NOT_FOUND" && e.code !== "ERR_MODULE_NOT_FOUND") {
		return false;
	}
	if (typeof e.message !== "string") return false;
	return e.message.includes(specifier);
}

function unwrap<T>(mod: { default?: T } & T): T {
	return mod.default ?? mod;
}

/**
 * Loads a required peer module, throwing a clear, actionable error when it
 * is not installed.
 *
 * Use this in preset factories so missing peers surface at preset-activation
 * time — never silently as an empty config.
 *
 * Detection and execution are split:
 *   1. `require.resolve(specifier)` decides whether the peer itself is
 *      installed. Only a `MODULE_NOT_FOUND` for the **requested** specifier
 *      is translated into the install hint.
 *   2. `require(specifier)` runs only after resolve succeeds, so any error
 *      thrown while evaluating the peer — including a transitive
 *      `MODULE_NOT_FOUND` whose name overlaps the requested specifier as a
 *      substring — propagates verbatim with its original stack.
 *
 * The optional `requireFn` parameter exists for tests to inject a synthetic
 * `require`; production callers should omit it.
 *
 * @param specifier - Bare module specifier to load (e.g. `"typescript-eslint"`).
 * @param preset - Preset name shown in the error message for context.
 * @param requireFn - Internal: injected require, defaults to the module's own.
 * @returns The module's default export when present, otherwise the namespace.
 * @throws Error with `pnpm add -D <specifier>` instructions when missing.
 */
export function requirePeer<T>(
	specifier: string,
	preset: string,
	requireFn: PeerRequire = defaultRequire,
): T {
	try {
		requireFn.resolve(specifier);
	} catch (error) {
		if (isResolveFailureFor(error, specifier)) {
			throw new Error(
				`[@lazyconfig/eslint]: preset "${preset}" requires "${specifier}", which is not installed.\n` +
					`  Run: pnpm add -D ${specifier}`,
				{ cause: error },
			);
		}
		throw error;
	}
	return unwrap(requireFn(specifier) as { default?: T } & T);
}

/**
 * Loads an optional peer module, returning `undefined` when it is not
 * installed. Use for genuinely optional sub-dependencies (e.g. `globals`)
 * — never for a preset's primary plugin, which should fail loudly via
 * {@link requirePeer}.
 *
 * Same detection/execution split as {@link requirePeer}: only a resolve-time
 * `MODULE_NOT_FOUND` for the requested specifier returns `undefined`. Errors
 * thrown while evaluating the peer propagate verbatim.
 *
 * @param specifier - Bare module specifier to load.
 * @param requireFn - Internal: injected require, defaults to the module's own.
 * @returns The module's default export (or namespace) typed as `T`, or
 * `undefined` when absent.
 */
export function tryRequirePeer<T>(
	specifier: string,
	requireFn: PeerRequire = defaultRequire,
): T | undefined {
	try {
		requireFn.resolve(specifier);
	} catch (error) {
		if (isResolveFailureFor(error, specifier)) return undefined;
		throw error;
	}
	return unwrap(requireFn(specifier) as { default?: T } & T);
}
