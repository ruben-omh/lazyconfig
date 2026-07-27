jest.mock("node:fs/promises", () => ({
	readFile: jest.fn(),
	copyFile: jest.fn(),
}));

jest.mock("../../../../src/helpers/run-command");
jest.mock("../../../../src/helpers/log");

import { readFile, copyFile } from "node:fs/promises";
import { types } from "../../../../src/commands/compile/sub-commands/scripts/types";
import { runCommand } from "../../../../src/helpers/run-command";
import { createLogger } from "../../../../src/helpers/log";

const mockedReadFile = jest.mocked(readFile);
const mockedCopyFile = jest.mocked(copyFile);
const mockedRunCommand = jest.mocked(runCommand);

const mockLog = {
	start: jest.fn(),
	success: jest.fn(),
	info: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
};

/** Returns a minimal api-extractor config JSON string with a dtsRollup path. */
function aecConfig(untrimmedFilePath?: string, projectFolder?: string): string {
	return JSON.stringify({
		projectFolder: projectFolder ?? ".",
		dtsRollup: untrimmedFilePath ? { untrimmedFilePath } : undefined,
	});
}

beforeEach(() => {
	jest.mocked(createLogger).mockReturnValue(mockLog);
	mockedRunCommand.mockResolvedValue("");
	mockedCopyFile.mockResolvedValue(undefined);
	mockedReadFile.mockResolvedValue(aecConfig("<projectFolder>/dist/index.d.ts"));
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
			mockedReadFile.mockResolvedValue(aecConfig());
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
			mockedReadFile.mockResolvedValue(aecConfig("<projectFolder>/dist/index.d.ts"));
			await types({ aec: ["api-extractor.json"] });
			expect(mockedCopyFile).not.toHaveBeenCalled();
		});

		it("does not copy when ext is an empty array", async () => {
			mockedReadFile.mockResolvedValue(aecConfig("<projectFolder>/dist/index.d.ts"));
			await types({ aec: ["api-extractor.json"], ext: [] });
			expect(mockedCopyFile).not.toHaveBeenCalled();
		});

		it("copies the .d.ts rollup to a .d.mts file when ext includes 'mts'", async () => {
			mockedReadFile.mockResolvedValue(aecConfig("<projectFolder>/dist/index.d.ts"));
			await types({ aec: ["api-extractor.json"], ext: ["mts"] });
			expect(mockedCopyFile).toHaveBeenCalledWith("./dist/index.d.ts", "./dist/index.d.mts");
		});

		it("emits one copy per ext entry", async () => {
			mockedReadFile.mockResolvedValue(aecConfig("<projectFolder>/dist/index.d.ts"));
			await types({ aec: ["api-extractor.json"], ext: ["mts", "cts"] });
			expect(mockedCopyFile).toHaveBeenCalledTimes(2);
			expect(mockedCopyFile).toHaveBeenCalledWith("./dist/index.d.ts", "./dist/index.d.mts");
			expect(mockedCopyFile).toHaveBeenCalledWith("./dist/index.d.ts", "./dist/index.d.cts");
		});

		it("normalizes ext tokens (strips leading '.' and 'd.')", async () => {
			mockedReadFile.mockResolvedValue(aecConfig("<projectFolder>/dist/index.d.ts"));
			await types({ aec: ["api-extractor.json"], ext: [".mts", ".d.cts"] });
			expect(mockedCopyFile).toHaveBeenCalledWith("./dist/index.d.ts", "./dist/index.d.mts");
			expect(mockedCopyFile).toHaveBeenCalledWith("./dist/index.d.ts", "./dist/index.d.cts");
		});

		it("skips copies when target equals source (ext === 'ts')", async () => {
			mockedReadFile.mockResolvedValue(aecConfig("<projectFolder>/dist/index.d.ts"));
			await types({ aec: ["api-extractor.json"], ext: ["ts"] });
			expect(mockedCopyFile).not.toHaveBeenCalled();
		});

		it("resolves the <projectFolder> token using the config's projectFolder field", async () => {
			mockedReadFile.mockResolvedValue(
				aecConfig("<projectFolder>/dist/my-lib.d.ts", "./packages/lib"),
			);
			await types({ aec: ["api-extractor.json"], ext: ["mts"] });
			expect(mockedCopyFile).toHaveBeenCalledWith(
				"./packages/lib/dist/my-lib.d.ts",
				"./packages/lib/dist/my-lib.d.mts",
			);
		});

		it("defaults projectFolder to '.' when not set in the config", async () => {
			mockedReadFile.mockResolvedValue(
				JSON.stringify({ dtsRollup: { untrimmedFilePath: "<projectFolder>/dist/index.d.ts" } }),
			);
			await types({ aec: ["api-extractor.json"], ext: ["mts"] });
			expect(mockedCopyFile).toHaveBeenCalledWith("./dist/index.d.ts", "./dist/index.d.mts");
		});

		it("skips the copy when dtsRollup is not configured", async () => {
			mockedReadFile.mockResolvedValue(JSON.stringify({}));
			await types({ aec: ["api-extractor.json"], ext: ["mts"] });
			expect(mockedCopyFile).not.toHaveBeenCalled();
		});

		it("skips the copy when untrimmedFilePath is not set", async () => {
			mockedReadFile.mockResolvedValue(aecConfig());
			await types({ aec: ["api-extractor.json"], ext: ["mts"] });
			expect(mockedCopyFile).not.toHaveBeenCalled();
		});

		it("reads the aec config file after api-extractor runs", async () => {
			const callOrder: string[] = [];
			mockedRunCommand.mockImplementation((cmd) => {
				callOrder.push(cmd);
				return Promise.resolve("");
			});
			mockedReadFile.mockImplementation(() => {
				callOrder.push("readFile");
				return Promise.resolve(aecConfig("<projectFolder>/dist/index.d.ts"));
			});
			await types({ aec: ["api-extractor.json"], ext: ["mts"] });
			expect(callOrder.indexOf("readFile")).toBeGreaterThan(callOrder.indexOf("api-extractor"));
		});

		it("does not read the aec config when ext is empty", async () => {
			await types({ aec: ["api-extractor.json"] });
			expect(mockedReadFile).not.toHaveBeenCalled();
		});

		it("produces a .d.mts for each aec config that has a dtsRollup path", async () => {
			mockedReadFile
				.mockResolvedValueOnce(aecConfig("<projectFolder>/dist/index.d.ts"))
				.mockResolvedValueOnce(aecConfig("<projectFolder>/dist/node.d.ts"));
			await types({ aec: ["api-extractor.json", "api-extractor.node.json"], ext: ["mts"] });
			expect(mockedCopyFile).toHaveBeenCalledTimes(2);
			expect(mockedCopyFile).toHaveBeenCalledWith("./dist/index.d.ts", "./dist/index.d.mts");
			expect(mockedCopyFile).toHaveBeenCalledWith("./dist/node.d.ts", "./dist/node.d.mts");
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
