jest.mock("node:fs/promises", () => ({
	copyFile: jest.fn(),
}));

// types.ts loads @microsoft/api-extractor through createRequire so the consumer's own
// install is used at runtime. Mocking node:module is what lets the test intercept that —
// a plain jest.mock of the package would not, since createRequire bypasses the registry.
// Deliberately a plain function, not a jest.fn — the suite-wide jest.resetAllMocks()
// would otherwise clear its implementation and make createRequire() return undefined.
jest.mock("node:module", () => ({
	createRequire: () => mockRequire,
}));

jest.mock("../../../../src/helpers/run-command");
jest.mock("../../../../src/helpers/log");

import { copyFile } from "node:fs/promises";
import { types } from "../../../../src/commands/compile/sub-commands/scripts/types";
import { runCommand } from "../../../../src/helpers/run-command";
import { createLogger } from "../../../../src/helpers/log";

const mockedCopyFile = jest.mocked(copyFile);
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

	describe("ext copies (.d.ts → .d.<ext>)", () => {
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
	// map pointing at .d.mts/.d.cts files that were never written.
	describe("ext copies — unresolvable rollup", () => {
		let exitSpy: jest.SpiedFunction<typeof process.exit>;

		beforeEach(() => {
			exitSpy = jest.spyOn(process, "exit").mockImplementation(() => {
				throw new Error("process.exit");
			});
		});

		afterEach(() => {
			exitSpy.mockRestore();
		});

		it("fails loudly when the config emits no rollup", async () => {
			mockLoadFileAndPrepare.mockReturnValue(prepared({ rollupEnabled: false }));
			await expect(types({ aec: ["api-extractor.json"], ext: ["mts"] })).rejects.toThrow(
				"process.exit",
			);
			expect(mockLog.error).toHaveBeenCalledWith(
				expect.stringContaining("produces no declaration rollup"),
			);
			expect(mockedCopyFile).not.toHaveBeenCalled();
		});

		it("fails loudly when every rollup path is unset", async () => {
			mockLoadFileAndPrepare.mockReturnValue(prepared({ untrimmedFilePath: "" }));
			await expect(types({ aec: ["api-extractor.json"], ext: ["mts"] })).rejects.toThrow(
				"process.exit",
			);
			expect(mockLog.error).toHaveBeenCalledWith(
				expect.stringContaining("produces no declaration rollup"),
			);
		});

		it("fails loudly when @microsoft/api-extractor cannot be resolved", async () => {
			mockRequire.mockImplementation(() => {
				throw new Error("Cannot find module '@microsoft/api-extractor'");
			});
			await expect(types({ aec: ["api-extractor.json"], ext: ["mts"] })).rejects.toThrow(
				"process.exit",
			);
			expect(mockLog.error).toHaveBeenCalledWith(
				expect.stringContaining("could not be resolved from this project"),
			);
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
});
