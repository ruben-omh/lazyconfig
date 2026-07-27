import { resolveExternal } from "../../src/resolvers/external";

describe("resolveExternal", () => {
	it("returns undefined when all inputs are undefined", () => {
		expect(resolveExternal(undefined, undefined, undefined)).toBeUndefined();
	});

	it("returns shared when formatLevel and globals are undefined", () => {
		expect(resolveExternal(["react"], undefined, undefined)).toEqual(["react"]);
	});

	it("returns formatLevel when shared and globals are undefined", () => {
		expect(resolveExternal(undefined, ["react"], undefined)).toEqual(["react"]);
	});

	it("unions shared and formatLevel strings, deduplicating", () => {
		const result = resolveExternal(["react", "lodash"], ["lodash", "vue"], undefined);
		expect(result).toEqual(["react", "lodash", "vue"]);
	});

	it("appends globals keys as externals", () => {
		const result = resolveExternal(["react"], undefined, { vue: "Vue" });
		expect(result).toEqual(["react", "vue"]);
	});

	it("does not duplicate globals keys already in shared", () => {
		const result = resolveExternal(["react"], undefined, { react: "React" });
		expect(result).toEqual(["react"]);
	});

	it("merges shared, formatLevel, and globals keys together", () => {
		const result = resolveExternal(["react"], ["lodash"], { vue: "Vue" });
		expect(result).toEqual(["react", "lodash", "vue"]);
	});

	it("ignores globals when it is a function", () => {
		const result = resolveExternal(["react"], undefined, () => "Global");
		expect(result).toEqual(["react"]);
	});

	it("uses override when either external is a function", () => {
		const fn = (id: string): boolean => id.startsWith("react");
		const result = resolveExternal(fn, ["lodash"], undefined);
		expect(result).toEqual(["lodash"]);
	});

	it("keeps RegExp entries from shared", () => {
		const result = resolveExternal([/^react/], undefined, undefined);
		expect(result).toEqual([/^react/]);
	});

	it("keeps RegExp entries from formatLevel", () => {
		const result = resolveExternal(["react"], [/^lodash/], undefined);
		expect(result).toContainEqual(/^lodash/);
	});

	it("returns a single string external as-is", () => {
		const result = resolveExternal("react", undefined, undefined);
		expect(result).toBe("react");
	});

	it("unions a string shared with an array formatLevel", () => {
		const result = resolveExternal("react", ["vue"], undefined);
		expect(result).toEqual(["react", "vue"]);
	});

	it("unions an array shared with a string formatLevel", () => {
		const result = resolveExternal(["react"], "vue", undefined);
		expect(result).toEqual(["react", "vue"]);
	});

	it("does not duplicate when string formatLevel is already in shared array", () => {
		const result = resolveExternal(["react"], "react", undefined);
		expect(result).toEqual(["react"]);
	});
});
