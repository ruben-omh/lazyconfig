jest.mock("node:fs/promises", () => ({
	copyFile: jest.fn(),
	readFile: jest.fn(),
}));

// types.ts loads @microsoft/api-extractor through createRequire so the consumer's own
// install is used at runtime. Mocking node:module is what lets the test intercept that -
// a plain jest.mock of the package would not, since createRequire bypasses the registry.
// Deliberately a plain function, not a jest.fn - the suite-wide jest.resetAllMocks()
// would otherwise clear its implementation and make createRequire() return undefined.
jest.mock("node:module", () => ({
	createRequire: () => mockRequire,
}));

jest.mock("../../../../src/helpers/run-command");
jest.mock("../../../../src/helpers/log");

import { copyFile, readFile } from "node:fs/promises";
import { types } from "../../../../src/commands/compile/sub-commands/scripts/types";
import { runCommand } from "../../../../src/helpers/run-command";
import { createLogger } from "../../../../src/helpers/log";

const mockedCopyFile = jest.mocked(copyFile);
const mockedReadFile = jest.mocked(readFile);
const mockedRunCommand = jest.mocked(runCommand);

const mockLoadFileAndPrepare = jest.fn();
const mockRequire = jest.fn(() => ({
	ExtractorConfig: { loadFileAndPrepare: mockLoadFileAndPrepare },
}));

const mockLog = {
	start: jest.fn(),
	success: jest.fn(),
	info: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
};

/**
 * Returns a prepared ExtractorConfig stub. api-extractor resolves every path to an
 * absolute location and reports unset rollup targets as empty strings, so the stub
 * mirrors both.
 */
function prepared(overrides: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		rollupEnabled: true,
		untrimmedFilePath: "/project/dist/index.d.ts",
		publicTrimmedFilePath: "",
		betaTrimmedFilePath: "",
		alphaTrimmedFilePath: "",
		...overrides,
	};
}

beforeEach(() => {
	jest.mocked(createLogger).mockReturnValue(mockLog);
	mockedRunCommand.mockResolvedValue("");
	mockedCopyFile.mockResolvedValue(undefined);
	mockedReadFile.mockResolvedValue("");
	mockRequire.mockReturnValue({
		ExtractorConfig: { loadFileAndPrepare: mockLoadFileAndPrepare },
	});
	mockLoadFileAndPrepare.mockReturnValue(prepared());
});

afterEach(() => {
	jest.resetAllMocks();
});

describe("types", () => {
	describe("tsc step", () => {
		it("runs tsc with --emitDeclarationOnly for the default tsconfig", async () => {
			await types();
			expect(mockedRunCommand).toHaveBeenCalledWith(
				"tsc",
				["--project", "tsconfig.json", "--emitDeclarationOnly"],
				expect.anything(),
			);
		});

		it("runs tsc for each tsconfig provided", async () => {
			await types({ tsc: ["tsconfig.lib.json", "tsconfig.node.json"] });
			expect(mockedRunCommand).toHaveBeenCalledWith(
				"tsc",
				["--project", "tsconfig.lib.json", "--emitDeclarationOnly"],
				expect.anything(),
			);
			expect(mockedRunCommand).toHaveBeenCalledWith(
				"tsc",
				["--project", "tsconfig.node.json", "--emitDeclarationOnly"],
				expect.anything(),
			);
		});

		it("runs all tsc passes before any api-extractor pass", async () => {
			const callOrder: string[] = [];
			mockedRunCommand.mockImplementation((cmd, args) => {
				callOrder.push(`${cmd}:${args[0]}`);
				return Promise.resolve("");
			});
			await types({ tsc: ["tsconfig.lib.json"], aec: ["api-extractor.json"] });
			expect(callOrder.indexOf("tsc:--project")).toBeLessThan(
				callOrder.indexOf("api-extractor:run"),
			);
		});

		it("includes stdio: inherit in tsc options", async () => {
			await types();
			expect(mockedRunCommand).toHaveBeenCalledWith(
				"tsc",
				expect.anything(),
				expect.objectContaining({ stdio: "inherit" }),
			);
		});

		it("includes a descriptive error message referencing the tsconfig path", async () => {
			await types({ tsc: ["tsconfig.lib.json"] });
			const tscCall = mockedRunCommand.mock.calls.find(([cmd]) => cmd === "tsc");
			expect(tscCall?.[2]?.error?.message).toContain("tsconfig.lib.json");
		});
	});

	describe("api-extractor step", () => {
		it("runs api-extractor with the default config", async () => {
			await types();
			expect(mockedRunCommand).toHaveBeenCalledWith(
				"api-extractor",
				["run", "--config", "api-extractor.json", "--local", "--verbose"],
				expect.anything(),
			);
		});

		it("runs api-extractor for each aec config provided", async () => {
			await types({ aec: ["api-extractor.json", "api-extractor.node.json"] });
			expect(mockedRunCommand).toHaveBeenCalledWith(
				"api-extractor",
				["run", "--config", "api-extractor.json", "--local", "--verbose"],
				expect.anything(),
			);
			expect(mockedRunCommand).toHaveBeenCalledWith(
				"api-extractor",
				["run", "--config", "api-extractor.node.json", "--local", "--verbose"],
				expect.anything(),
			);
		});

		it("includes stdio: inherit in api-extractor options", async () => {
			await types();
			expect(mockedRunCommand).toHaveBeenCalledWith(
				"api-extractor",
				expect.anything(),
				expect.objectContaining({ stdio: "inherit" }),
			);
		});

		it("includes a descriptive error message referencing the aec config path", async () => {
			await types({ aec: ["api-extractor.json"] });
			const aecCall = mockedRunCommand.mock.calls.find(([cmd]) => cmd === "api-extractor");
			expect(aecCall?.[2]?.error?.message).toContain("api-extractor.json");
		});
	});

	describe("ext copies (.d.ts -> .d.<ext>)", () => {
		it("does not copy when ext is omitted (opt-in)", async () => {
			await types({ aec: ["api-extractor.json"] });
			expect(mockedCopyFile).not.toHaveBeenCalled();
		});

		it("does not copy when ext is an empty array", async () => {
			await types({ aec: ["api-extractor.json"], ext: [] });
			expect(mockedCopyFile).not.toHaveBeenCalled();
		});

		it("copies the .d.ts rollup to a .d.mts file when ext includes 'mts'", async () => {
			await types({ aec: ["api-extractor.json"], ext: ["mts"] });
			expect(mockedCopyFile).toHaveBeenCalledWith(
				"/project/dist/index.d.ts",
				"/project/dist/index.d.mts",
			);
		});

		it("emits one copy per ext entry", async () => {
			await types({ aec: ["api-extractor.json"], ext: ["mts", "cts"] });
			expect(mockedCopyFile).toHaveBeenCalledTimes(2);
			expect(mockedCopyFile).toHaveBeenCalledWith(
				"/project/dist/index.d.ts",
				"/project/dist/index.d.mts",
			);
			expect(mockedCopyFile).toHaveBeenCalledWith(
				"/project/dist/index.d.ts",
				"/project/dist/index.d.cts",
			);
		});

		it("normalizes ext tokens (strips leading '.' and 'd.')", async () => {
			await types({ aec: ["api-extractor.json"], ext: [".mts", ".d.cts"] });
			expect(mockedCopyFile).toHaveBeenCalledWith(
				"/project/dist/index.d.ts",
				"/project/dist/index.d.mts",
			);
			expect(mockedCopyFile).toHaveBeenCalledWith(
				"/project/dist/index.d.ts",
				"/project/dist/index.d.cts",
			);
		});

		it("skips copies when target equals source (ext === 'ts')", async () => {
			await types({ aec: ["api-extractor.json"], ext: ["ts"] });
			expect(mockedCopyFile).not.toHaveBeenCalled();
		});

		it("falls back to publicTrimmedFilePath when no untrimmed rollup is configured", async () => {
			mockLoadFileAndPrepare.mockReturnValue(
				prepared({
					untrimmedFilePath: "",
					publicTrimmedFilePath: "/project/dist/public.d.ts",
				}),
			);
			await types({ aec: ["api-extractor.json"], ext: ["mts"] });
			expect(mockedCopyFile).toHaveBeenCalledWith(
				"/project/dist/public.d.ts",
				"/project/dist/public.d.mts",
			);
		});

		it("prepares the aec config through api-extractor after it runs", async () => {
			const callOrder: string[] = [];
			mockedRunCommand.mockImplementation((cmd) => {
				callOrder.push(cmd);
				return Promise.resolve("");
			});
			mockLoadFileAndPrepare.mockImplementation(() => {
				callOrder.push("loadFileAndPrepare");
				return prepared();
			});
			await types({ aec: ["api-extractor.json"], ext: ["mts"] });
			expect(callOrder.indexOf("loadFileAndPrepare")).toBeGreaterThan(
				callOrder.indexOf("api-extractor"),
			);
		});

		it("does not load the aec config when ext is empty", async () => {
			await types({ aec: ["api-extractor.json"] });
			expect(mockLoadFileAndPrepare).not.toHaveBeenCalled();
		});

		it("produces a .d.mts for each aec config", async () => {
			mockLoadFileAndPrepare
				.mockReturnValueOnce(prepared())
				.mockReturnValueOnce(prepared({ untrimmedFilePath: "/project/dist/node.d.ts" }));
			await types({ aec: ["api-extractor.json", "api-extractor.node.json"], ext: ["mts"] });
			expect(mockedCopyFile).toHaveBeenCalledTimes(2);
			expect(mockedCopyFile).toHaveBeenCalledWith(
				"/project/dist/index.d.ts",
				"/project/dist/index.d.mts",
			);
			expect(mockedCopyFile).toHaveBeenCalledWith(
				"/project/dist/node.d.ts",
				"/project/dist/node.d.mts",
			);
		});
	});

	// Previously these two paths returned silently, leaving the dual-package "exports"
	// map pointing at .d.mts/.d.cts files that were never written. They now throw so the
	// rejection reaches the CLI's `.fail` handler (which logs and exits 1).
	describe("ext copies - unresolvable rollup", () => {
		it("fails loudly when the config emits no rollup", async () => {
			mockLoadFileAndPrepare.mockReturnValue(prepared({ rollupEnabled: false }));
			await expect(types({ aec: ["api-extractor.json"], ext: ["mts"] })).rejects.toThrow(
				"produces no declaration rollup",
			);
			expect(mockedCopyFile).not.toHaveBeenCalled();
		});

		it("fails loudly when every rollup path is unset", async () => {
			mockLoadFileAndPrepare.mockReturnValue(prepared({ untrimmedFilePath: "" }));
			await expect(types({ aec: ["api-extractor.json"], ext: ["mts"] })).rejects.toThrow(
				"produces no declaration rollup",
			);
			expect(mockedCopyFile).not.toHaveBeenCalled();
		});

		it("fails loudly when @microsoft/api-extractor cannot be resolved", async () => {
			mockRequire.mockImplementation(() => {
				throw new Error("Cannot find module '@microsoft/api-extractor'");
			});
			await expect(types({ aec: ["api-extractor.json"], ext: ["mts"] })).rejects.toThrow(
				"could not be resolved from this project",
			);
		});
	});

	describe("ext validation", () => {
		it("rejects an unsupported ext token", async () => {
			await expect(types({ aec: ["api-extractor.json"], ext: ["js"] })).rejects.toThrow(
				'Invalid --ext value "js"',
			);
		});

		it("validates ext up front, before any compilation runs", async () => {
			await expect(types({ ext: ["nope"] })).rejects.toThrow("Invalid --ext value");
			expect(mockedRunCommand).not.toHaveBeenCalled();
		});

		it("accepts the normalized forms of valid tokens", async () => {
			await types({ aec: ["api-extractor.json"], ext: [".mts", ".d.cts"] });
			expect(mockedCopyFile).toHaveBeenCalledWith(
				"/project/dist/index.d.ts",
				"/project/dist/index.d.mts",
			);
			expect(mockedCopyFile).toHaveBeenCalledWith(
				"/project/dist/index.d.ts",
				"/project/dist/index.d.cts",
			);
		});

		it("de-duplicates repeated ext tokens", async () => {
			await types({ aec: ["api-extractor.json"], ext: ["mts", "mts"] });
			expect(mockedCopyFile).toHaveBeenCalledTimes(1);
		});
	});

	describe("ext copies - every rollup variant", () => {
		it("copies both the untrimmed and trimmed rollups when both are configured", async () => {
			mockLoadFileAndPrepare.mockReturnValue(
				prepared({ publicTrimmedFilePath: "/project/dist/public.d.ts" }),
			);
			await types({ aec: ["api-extractor.json"], ext: ["mts"] });
			expect(mockedCopyFile).toHaveBeenCalledTimes(2);
			expect(mockedCopyFile).toHaveBeenCalledWith(
				"/project/dist/index.d.ts",
				"/project/dist/index.d.mts",
			);
			expect(mockedCopyFile).toHaveBeenCalledWith(
				"/project/dist/public.d.ts",
				"/project/dist/public.d.mts",
			);
		});

		it("de-duplicates rollup variants that resolve to the same path", async () => {
			mockLoadFileAndPrepare.mockReturnValue(
				prepared({ publicTrimmedFilePath: "/project/dist/index.d.ts" }),
			);
			await types({ aec: ["api-extractor.json"], ext: ["mts"] });
			expect(mockedCopyFile).toHaveBeenCalledTimes(1);
		});

		it("skips and warns when a rollup path does not end in .d.ts", async () => {
			mockLoadFileAndPrepare.mockReturnValue(
				prepared({ untrimmedFilePath: "/project/dist/index.d.mts" }),
			);
			await types({ aec: ["api-extractor.json"], ext: ["mts"] });
			expect(mockedCopyFile).not.toHaveBeenCalled();
			expect(mockLog.warn).toHaveBeenCalledWith(expect.stringContaining("does not end in .d.ts"));
		});
	});

	describe("verbatim-copy warnings", () => {
		it("warns when the rollup still contains relative imports", async () => {
			mockedReadFile.mockResolvedValue('export { x } from "./internal";');
			await types({ aec: ["api-extractor.json"], ext: ["mts"] });
			expect(mockLog.warn).toHaveBeenCalledWith(expect.stringContaining("relative imports"));
		});

		it("warns when a .d.cts copy would carry a default export", async () => {
			mockedReadFile.mockResolvedValue("export default function foo() {}");
			await types({ aec: ["api-extractor.json"], ext: ["cts"] });
			expect(mockLog.warn).toHaveBeenCalledWith(expect.stringContaining("default export"));
		});

		it("does not warn about default exports when no .d.cts copy is requested", async () => {
			mockedReadFile.mockResolvedValue("export default function foo() {}");
			await types({ aec: ["api-extractor.json"], ext: ["mts"] });
			expect(mockLog.warn).not.toHaveBeenCalledWith(expect.stringContaining("default export"));
		});

		it("does not warn for a clean rollup", async () => {
			mockedReadFile.mockResolvedValue("export declare const x: number;");
			await types({ aec: ["api-extractor.json"], ext: ["mts", "cts"] });
			expect(mockLog.warn).not.toHaveBeenCalled();
		});
	});

	describe("watch mode", () => {
		it("passes watch flag to tsc runCommand options", async () => {
			await types({ watch: true });
			expect(mockedRunCommand).toHaveBeenCalledWith(
				"tsc",
				expect.anything(),
				expect.objectContaining({ watch: true }),
			);
		});

		it("passes watch flag to api-extractor runCommand options", async () => {
			await types({ watch: true });
			expect(mockedRunCommand).toHaveBeenCalledWith(
				"api-extractor",
				expect.anything(),
				expect.objectContaining({ watch: true }),
			);
		});

		it("creates the logger with watch: false when not set", async () => {
			await types();
			expect(jest.mocked(createLogger)).toHaveBeenCalledWith("types", false);
		});

		it("creates the logger with watch: true when set", async () => {
			await types({ watch: true });
			expect(jest.mocked(createLogger)).toHaveBeenCalledWith("types", true);
		});

		it("logs success on completion", async () => {
			await types();
			expect(mockLog.success).toHaveBeenCalledWith(expect.stringContaining("successfully"));
		});
	});

	// settleAll's contract: run EVERY sibling task to completion, then rethrow the FIRST
	// failure in source order (never short-circuit on whichever rejects first in time).
	// Promise.allSettled is what waits for every sibling before picking the first-listed
	// rejection; a bare Promise.all would reject with the first-in-time failure and abandon
	// the rest. Here the second config rejects sooner, yet the first config's failure must
	// surface -- which also proves the later-settling first config was waited on to completion.
	describe("settleAll contract (first failure in source order wins)", () => {
		it("rethrows the first config's failure even when a later config rejects sooner", async () => {
			mockedRunCommand.mockImplementation((cmd, args) => {
				if (cmd === "api-extractor" && args[2] === "first.json") {
					return new Promise<string>((_resolve, reject) =>
						setTimeout(() => reject(new Error("first config failed")), 10),
					);
				}
				if (cmd === "api-extractor" && args[2] === "second.json") {
					return Promise.reject(new Error("second config failed"));
				}
				return Promise.resolve("");
			});

			await expect(types({ aec: ["first.json", "second.json"] })).rejects.toThrow(
				"first config failed",
			);
		});
	});
});
