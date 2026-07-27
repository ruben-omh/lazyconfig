import { type PeerRequire, requirePeer, tryRequirePeer } from "../../src/helpers/require-peer";

const MISSING = "@lazyconfig/__nonexistent-fixture__";

// --- helpers ---

type FakeRequireOptions = {
	resolveThrows?: unknown;
	loadThrows?: unknown;
	loadReturns?: unknown;
};

// Builds a synthetic require so tests can simulate resolver/loader failures
// without depending on real on-disk packages. Only the surface the helpers
// touch (`resolve` + the call itself) is implemented; other PeerRequire
// fields are stubbed enough to satisfy the type at the cast site.
const makeFakeRequire = (opts: FakeRequireOptions): PeerRequire => {
	const fn = ((_specifier: string): unknown => {
		// eslint-disable-next-line @typescript-eslint/only-throw-error -- tests intentionally throw non-Error payloads to verify propagation
		if (opts.loadThrows !== undefined) throw opts.loadThrows;
		return opts.loadReturns;
	}) as PeerRequire;
	fn.resolve = ((specifier: string): string => {
		// eslint-disable-next-line @typescript-eslint/only-throw-error -- see above
		if (opts.resolveThrows !== undefined) throw opts.resolveThrows;
		return `/fake/${specifier}`;
	}) as PeerRequire["resolve"];
	fn.cache = Object.create(null) as PeerRequire["cache"];
	fn.main = undefined;
	return fn;
};

const moduleNotFound = (message: string): Error & { code: string } => {
	const err = new Error(message) as Error & { code: string };
	err.code = "MODULE_NOT_FOUND";
	return err;
};

// --- tests ---

describe("requirePeer", () => {
	describe("when the peer is installed", () => {
		it("returns the resolved module", () => {
			expect(requirePeer("eslint-config-prettier", "prettier")).toBeDefined();
		});
	});

	describe("when the peer is not installed", () => {
		it("throws an Error", () => {
			expect(() => requirePeer(MISSING, "typescript")).toThrow(Error);
		});

		it("names the preset in the message", () => {
			expect(() => requirePeer(MISSING, "typescript")).toThrow(/preset "typescript"/);
		});

		it("names the missing specifier in the message", () => {
			expect(() => requirePeer(MISSING, "typescript")).toThrow(MISSING);
		});

		it("includes the pnpm install hint", () => {
			const escaped = MISSING.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
			expect(() => requirePeer(MISSING, "typescript")).toThrow(
				new RegExp(`pnpm add -D ${escaped}`),
			);
		});

		it("prefixes the message with the package name", () => {
			expect(() => requirePeer(MISSING, "typescript")).toThrow(/^\[@lazyconfig\/eslint\]:/);
		});
	});

	// The detection branch only runs on `require.resolve` errors. Resolve does
	// not execute the peer, so a transitive MODULE_NOT_FOUND thrown by the
	// peer's loader (e.g. `<spec>-helper` while loading `<spec>`) flows through
	// the load path and propagates verbatim — never mistranslated into a
	// "pnpm add -D <spec>" hint for a peer that is actually installed.
	describe("substring guard", () => {
		it("propagates a transitive MODULE_NOT_FOUND thrown by the peer's loader", () => {
			const transitive = moduleNotFound(
				"Cannot find module '@scope/peer-helper'\nRequire stack:\n- /n_m/@scope/peer/index.js",
			);
			const fakeRequire = makeFakeRequire({ loadThrows: transitive });
			expect(() => requirePeer("@scope/peer", "scoped", fakeRequire)).toThrow(transitive);
		});

		it("does not translate a transitive MODULE_NOT_FOUND into the install hint", () => {
			const transitive = moduleNotFound("Cannot find module '@scope/peer-helper'");
			const fakeRequire = makeFakeRequire({ loadThrows: transitive });
			expect(() => requirePeer("@scope/peer", "scoped", fakeRequire)).not.toThrow(
				/pnpm add -D @scope\/peer/,
			);
		});
	});

	describe("propagating non-detection errors", () => {
		it("re-throws a non-MNF error raised while evaluating the peer", () => {
			const syntax = new SyntaxError("unexpected token in peer module");
			const fakeRequire = makeFakeRequire({ loadThrows: syntax });
			expect(() => requirePeer("@scope/peer", "scoped", fakeRequire)).toThrow(syntax);
		});

		it("re-throws a non-MNF error raised by the resolver", () => {
			const fsError = Object.assign(new Error("EACCES: permission denied"), { code: "EACCES" });
			const fakeRequire = makeFakeRequire({ resolveThrows: fsError });
			expect(() => requirePeer("@scope/peer", "scoped", fakeRequire)).toThrow(fsError);
		});

		it("re-throws non-object thrown payloads verbatim", () => {
			const fakeRequire = makeFakeRequire({
				resolveThrows: "string thrown by a hostile loader",
			});
			expect(() => requirePeer("@scope/peer", "scoped", fakeRequire)).toThrow(
				"string thrown by a hostile loader",
			);
		});
	});

	describe("default-vs-namespace handling", () => {
		it("unwraps the default export when present", () => {
			const namespace = { default: { tag: "default-export" }, named: 1 };
			const fakeRequire = makeFakeRequire({ loadReturns: namespace });
			expect(requirePeer<{ tag: string }>("@scope/peer", "scoped", fakeRequire)).toEqual({
				tag: "default-export",
			});
		});

		it("returns the namespace when no default export is set", () => {
			const namespace = { named: 1 };
			const fakeRequire = makeFakeRequire({ loadReturns: namespace });
			expect(requirePeer<typeof namespace>("@scope/peer", "scoped", fakeRequire)).toBe(namespace);
		});
	});
});

describe("tryRequirePeer", () => {
	it("returns the resolved module when installed", () => {
		expect(tryRequirePeer("eslint-config-prettier")).toBeDefined();
	});

	it("returns undefined when the module is not installed", () => {
		expect(tryRequirePeer(MISSING)).toBeUndefined();
	});

	describe("substring guard", () => {
		it("propagates a transitive MODULE_NOT_FOUND thrown by the peer's loader", () => {
			const transitive = moduleNotFound("Cannot find module '@scope/peer-helper'");
			const fakeRequire = makeFakeRequire({ loadThrows: transitive });
			expect(() => tryRequirePeer("@scope/peer", fakeRequire)).toThrow(transitive);
		});

		it("does not silently return undefined for a transitive MODULE_NOT_FOUND", () => {
			const transitive = moduleNotFound("Cannot find module '@scope/peer-helper'");
			const fakeRequire = makeFakeRequire({ loadThrows: transitive });
			expect(() => tryRequirePeer("@scope/peer", fakeRequire)).toThrow();
		});
	});

	describe("propagating non-detection errors", () => {
		it("re-throws a non-MNF error raised while evaluating the peer", () => {
			const syntax = new SyntaxError("unexpected token in peer module");
			const fakeRequire = makeFakeRequire({ loadThrows: syntax });
			expect(() => tryRequirePeer("@scope/peer", fakeRequire)).toThrow(syntax);
		});

		it("re-throws a non-MNF error raised by the resolver", () => {
			const fsError = Object.assign(new Error("EACCES: permission denied"), { code: "EACCES" });
			const fakeRequire = makeFakeRequire({ resolveThrows: fsError });
			expect(() => tryRequirePeer("@scope/peer", fakeRequire)).toThrow(fsError);
		});
	});

	describe("default-vs-namespace handling", () => {
		it("unwraps the default export when present", () => {
			const namespace = { default: { tag: "default-export" }, named: 1 };
			const fakeRequire = makeFakeRequire({ loadReturns: namespace });
			expect(tryRequirePeer<{ tag: string }>("@scope/peer", fakeRequire)).toEqual({
				tag: "default-export",
			});
		});

		it("returns the namespace when no default export is set", () => {
			const namespace = { named: 1 };
			const fakeRequire = makeFakeRequire({ loadReturns: namespace });
			expect(tryRequirePeer<typeof namespace>("@scope/peer", fakeRequire)).toBe(namespace);
		});
	});
});
