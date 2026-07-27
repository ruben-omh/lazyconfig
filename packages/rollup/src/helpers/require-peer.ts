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

/**
 * Loads a required peer plugin module, throwing a clear, actionable error
 * when it is not installed.
 *
 * Use this in plugin option factories so missing peers surface at config
 * resolution — never silently as a no-op plugin.
 *
 * Detection and execution are split:
 *   1. `require.resolve(specifier)` decides whether the peer itself is
 *      installed. Only a `MODULE_NOT_FOUND` for the **requested** specifier
 *      (matched as a quoted token) is translated into the install hint.
 *   2. `require(specifier)` runs only after resolve succeeds, so any error
 *      thrown while evaluating the peer — including a transitive
 *      `MODULE_NOT_FOUND` whose name overlaps the requested specifier as a
 *      substring — propagates verbatim with its original stack.
 *
 * The optional `requireFn` parameter exists for tests to inject a synthetic
 * `require`; production callers should omit it.
 *
 * @param specifier - Bare module specifier to load (e.g. `"@rollup/plugin-babel"`).
 * @param requireFn - Internal: injected require, defaults to the module's own.
 * @returns The module's default export when present, otherwise the namespace.
 * @throws Error with `pnpm add -D <specifier>` instructions when missing.
 */
export function requirePeer<T>(specifier: string, requireFn: PeerRequire = defaultRequire): T {
	try {
		requireFn.resolve(specifier);
	} catch (error) {
		if (isResolveFailureFor(error, specifier)) {
			throw new Error(
				`[@lazyconfig/rollup]: plugin "${specifier}" is enabled but the package is not installed.\n` +
					`  Run: pnpm add -D ${specifier}`,
				{ cause: error },
			);
		}
		throw error;
	}
	const mod = requireFn(specifier) as { default?: T } & T;
	return mod.default ?? mod;
}
