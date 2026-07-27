import { mergeGlobals } from "../../src/resolvers/globals";

describe("mergeGlobals", () => {
	it("returns undefined when both inputs are undefined", () => {
		expect(mergeGlobals(undefined, undefined)).toBeUndefined();
	});

	it("returns base when override is undefined", () => {
		const base = { react: "React" };
		expect(mergeGlobals(base, undefined)).toBe(base);
	});

	it("returns override when base is undefined", () => {
		const override = { react: "React" };
		expect(mergeGlobals(undefined, override)).toBe(override);
	});

	it("merges two objects with override taking precedence", () => {
		expect(mergeGlobals({ react: "React", lodash: "Lodash" }, { react: "R" })).toEqual({
			react: "R",
			lodash: "Lodash",
		});
	});

	it("includes keys present only in base", () => {
		expect(mergeGlobals({ react: "React" }, { vue: "Vue" })).toEqual({
			react: "React",
			vue: "Vue",
		});
	});

	it("prefers override when both are functions", () => {
		const base = (): string => "Base";
		const override = (): string => "Override";
		expect(mergeGlobals(base, override)).toBe(override);
	});

	it("prefers override when base is object and override is function", () => {
		const override = (): string => "Override";
		expect(mergeGlobals({ react: "React" }, override)).toBe(override);
	});

	it("prefers override when base is function and override is object", () => {
		const override = { react: "React" };
		expect(mergeGlobals((): string => "Base", override)).toBe(override);
	});
});
