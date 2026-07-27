import type { Plugin } from "rollup";
import { mergePlugins, buildPlugins } from "../../src/resolvers/plugins";
import type { PluginsOptions } from "../../src/types";

// --- mergePlugins ---

describe("mergePlugins", () => {
	it("returns empty object when both inputs are undefined", () => {
		expect(mergePlugins(undefined, undefined)).toEqual({});
	});

	it("returns base when override is undefined", () => {
		const base: PluginsOptions = { node: true, babel: true };
		expect(mergePlugins(base, undefined)).toEqual(base);
	});

	it("returns override when base is undefined", () => {
		const override: PluginsOptions = { node: true };
		expect(mergePlugins(undefined, override)).toEqual(override);
	});

	it("override wins for named plugins", () => {
		expect(mergePlugins({ node: true }, { node: false })).toMatchObject({ node: false });
	});

	it("keeps base named plugin when override does not specify it", () => {
		expect(mergePlugins({ babel: true }, { node: true })).toMatchObject({
			babel: true,
			node: true,
		});
	});

	it("concatenates extra arrays — base first, then override", () => {
		const pluginA = { name: "a" } as Plugin;
		const pluginB = { name: "b" } as Plugin;
		const result = mergePlugins({ extra: [pluginA] }, { extra: [pluginB] });
		expect(result.extra).toEqual([pluginA, pluginB]);
	});

	it("handles missing extra on either side gracefully", () => {
		const pluginA = { name: "a" } as Plugin;
		expect(mergePlugins({ extra: [pluginA] }, {})).toMatchObject({ extra: [pluginA] });
		expect(mergePlugins({}, { extra: [pluginA] })).toMatchObject({ extra: [pluginA] });
	});
});

// --- plugin option functions with object config ---

describe("buildPlugins with object config", () => {
	it("passes custom extensions to babel when config is an object", () => {
		const plugins = buildPlugins({ babel: { extensions: [".js"] } });
		expect(plugins[0]?.name).toBe("babel");
	});

	it("passes custom extensions to node-resolve when config is an object", () => {
		const plugins = buildPlugins({ node: { extensions: [".js"] } });
		expect(plugins[0]?.name).toBe("node-resolve");
	});

	it("passes options to json when config is an object", () => {
		const plugins = buildPlugins({ json: { compact: true } });
		expect(plugins[0]?.name).toBe("json");
	});

	it("passes options to replace when config is an object", () => {
		const plugins = buildPlugins({ replace: { values: { __VERSION__: "1.0.0" } } });
		expect(plugins[0]?.name).toBe("replace");
	});

	it("passes options to terser when config is an object", () => {
		const plugins = buildPlugins({ terser: { compress: false } });
		expect(plugins[0]?.name).toBe("terser");
	});
});

// --- buildPlugins ---

describe("buildPlugins", () => {
	it("returns empty array when all plugins are disabled", () => {
		expect(buildPlugins({})).toEqual([]);
	});

	it("includes node plugin when enabled", () => {
		const plugins = buildPlugins({ node: true });
		expect(plugins.length).toBe(1);
		expect(plugins[0]?.name).toBe("node-resolve");
	});

	it("includes babel plugin when enabled", () => {
		const plugins = buildPlugins({ babel: true });
		expect(plugins.length).toBe(1);
		expect(plugins[0]?.name).toBe("babel");
	});

	it("includes json plugin when enabled", () => {
		const plugins = buildPlugins({ json: true });
		expect(plugins.length).toBe(1);
		expect(plugins[0]?.name).toBe("json");
	});

	it("includes replace plugin when enabled", () => {
		const plugins = buildPlugins({ replace: { values: {} } });
		expect(plugins.length).toBe(1);
		expect(plugins[0]?.name).toBe("replace");
	});

	it("includes terser plugin when enabled", () => {
		const plugins = buildPlugins({ terser: true });
		expect(plugins.length).toBe(1);
		expect(plugins[0]?.name).toBe("terser");
	});

	it("respects pipeline order: node → json → babel → replace → terser → extra", () => {
		const extraPlugin = { name: "my-plugin" } as Plugin;
		const plugins = buildPlugins({
			node: true,
			json: true,
			babel: true,
			replace: { values: {} },
			terser: true,
			extra: [extraPlugin],
		});
		const names = plugins.map((p) => p.name);
		expect(names).toEqual(["node-resolve", "json", "babel", "replace", "terser", "my-plugin"]);
	});

	it("appends extra plugins at the end", () => {
		const extra = { name: "custom" } as Plugin;
		const plugins = buildPlugins({ node: true, extra: [extra] });
		expect(plugins[plugins.length - 1]).toBe(extra);
	});
});
