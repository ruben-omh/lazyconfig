import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { EventEmitter } from "node:events";
import { consola } from "consola";
import { createLogger } from "../../src/helpers/log";
import { runCommand, runCommandSync } from "../../src/helpers/run-command";

jest.mock("node:child_process");
jest.mock("../../src/helpers/log");

const mockedExecFileSync = jest.mocked(execFileSync);
const mockedSpawn = jest.mocked(spawn);

// ---------------------------------------------------------------------------
// Mock logger returned by createLogger
// ---------------------------------------------------------------------------

const mockLog = {
	start: jest.fn(),
	success: jest.fn(),
	info: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
};

beforeEach(() => {
	jest.mocked(createLogger).mockReturnValue(mockLog);
});

afterEach(() => {
	jest.resetAllMocks();
});

// ---------------------------------------------------------------------------
// Helpers for mocking spawn
// ---------------------------------------------------------------------------

type MockReadable = EventEmitter & { setEncoding: jest.Mock };

function makeMockReadable(): MockReadable {
	return Object.assign(new EventEmitter(), { setEncoding: jest.fn() });
}

function makeMockChild(stdoutData: string, stderrData: string, exitCode: number): ChildProcess {
	const stdout = makeMockReadable();
	const stderr = makeMockReadable();
	const child = Object.assign(new EventEmitter(), { stdout, stderr }) as unknown as ChildProcess;

	process.nextTick(() => {
		if (stdoutData) stdout.emit("data", stdoutData);
		if (stderrData) stderr.emit("data", stderrData);
		child.emit("close", exitCode);
	});

	return child;
}

function makeMockChildInherit(exitCode: number): ChildProcess {
	const child = Object.assign(new EventEmitter(), {
		stdout: null,
		stderr: null,
	}) as unknown as ChildProcess;
	process.nextTick(() => child.emit("close", exitCode));
	return child;
}

// ---------------------------------------------------------------------------
// runCommandSync
// ---------------------------------------------------------------------------

describe("runCommandSync", () => {
	let exitSpy: jest.SpyInstance;
	let errorSpy: jest.SpyInstance;

	beforeEach(() => {
		exitSpy = jest.spyOn(process, "exit").mockImplementation(() => undefined as never);
		errorSpy = jest.spyOn(consola, "error").mockImplementation(() => undefined);
	});

	describe("success", () => {
		it("returns trimmed stdout", () => {
			mockedExecFileSync.mockReturnValue("  hello world  ");
			expect(runCommandSync("echo", ["hello"], {})).toBe("hello world");
		});

		it("returns an empty string when stdio is inherit", () => {
			mockedExecFileSync.mockReturnValue(null as unknown as string);
			expect(runCommandSync("echo", ["hello"], { stdio: "inherit" })).toBe("");
		});

		it("passes the command and args to execFileSync", () => {
			mockedExecFileSync.mockReturnValue("output");
			runCommandSync("git", ["status"], {});
			expect(mockedExecFileSync).toHaveBeenCalledWith("git", ["status"], expect.anything());
		});

		it("forwards the encoding option to execFileSync", () => {
			mockedExecFileSync.mockReturnValue("output");
			runCommandSync("git", ["status"], { encoding: "utf-8" });
			expect(mockedExecFileSync).toHaveBeenCalledWith(
				expect.anything(),
				expect.anything(),
				expect.objectContaining({ encoding: "utf-8" }),
			);
		});

		it("logs the command when watch is true", () => {
			mockedExecFileSync.mockReturnValue("output");
			runCommandSync("git", ["status"], { watch: true });
			expect(mockLog.start).toHaveBeenCalledWith(expect.stringContaining("git status"));
		});
	});

	describe("failure — non-silent", () => {
		const err = new Error("command not found");

		it("calls process.exit with code 1", () => {
			mockedExecFileSync.mockImplementation(() => {
				throw err;
			});
			runCommandSync("git", ["status"], {});
			expect(exitSpy).toHaveBeenCalledWith(1);
		});

		it("logs the provided error message to stderr", () => {
			mockedExecFileSync.mockImplementation(() => {
				throw err;
			});
			runCommandSync("git", ["status"], { error: { message: "git failed" } });
			expect(mockLog.error).toHaveBeenCalledWith("git failed");
		});

		it("falls back to the raw error when no custom message is provided", () => {
			mockedExecFileSync.mockImplementation(() => {
				throw err;
			});
			runCommandSync("git", ["status"], {});
			expect(mockLog.error).toHaveBeenCalledWith(err);
		});

		it("does not log an example when none is provided", () => {
			mockedExecFileSync.mockImplementation(() => {
				throw err;
			});
			runCommandSync("git", ["status"], { error: { message: "failed" } });
			expect(mockLog.error).toHaveBeenCalledTimes(1);
			expect(mockLog.info).not.toHaveBeenCalled();
		});

		// watch is left off deliberately — the hint must survive the default silent path,
		// where every log method except error is a no-op.
		it("logs the example on the error channel when provided", () => {
			mockedExecFileSync.mockImplementation(() => {
				throw err;
			});
			runCommandSync("git", ["config", "user.name"], {
				error: { message: "user.name not set", example: 'git config user.name "Name"' },
			});
			expect(mockLog.error).toHaveBeenCalledWith("user.name not set");
			expect(mockLog.error).toHaveBeenCalledWith('Run: git config user.name "Name"');
			expect(mockLog.info).not.toHaveBeenCalled();
		});
	});

	describe("failure — silent", () => {
		const err = new Error("silent error");

		it("re-throws the raw error", () => {
			mockedExecFileSync.mockImplementation(() => {
				throw err;
			});
			expect(() => runCommandSync("git", ["status"], { error: { silent: true } })).toThrow(err);
		});

		it("does not log anything to stderr", () => {
			mockedExecFileSync.mockImplementation(() => {
				throw err;
			});
			try {
				runCommandSync("git", ["status"], { error: { silent: true } });
			} catch {
				/* ignore */
			}
			expect(errorSpy).not.toHaveBeenCalled();
		});

		it("does not call process.exit", () => {
			mockedExecFileSync.mockImplementation(() => {
				throw err;
			});
			try {
				runCommandSync("git", ["status"], { error: { silent: true } });
			} catch {
				/* ignore */
			}
			expect(exitSpy).not.toHaveBeenCalled();
		});
	});
});

// ---------------------------------------------------------------------------
// runCommand
// ---------------------------------------------------------------------------

describe("runCommand", () => {
	let exitSpy: jest.SpyInstance;
	let errorSpy: jest.SpyInstance;

	beforeEach(() => {
		exitSpy = jest.spyOn(process, "exit").mockImplementation(() => undefined as never);
		errorSpy = jest.spyOn(consola, "error").mockImplementation(() => undefined);
	});

	describe("success", () => {
		it("resolves with trimmed stdout", async () => {
			mockedSpawn.mockReturnValue(makeMockChild("  hello world  ", "", 0));
			await expect(runCommand("echo", ["hello"], {})).resolves.toBe("hello world");
		});

		it("resolves with an empty string when stdio is inherit", async () => {
			mockedSpawn.mockReturnValue(makeMockChildInherit(0));
			await expect(runCommand("echo", ["hello"], { stdio: "inherit" })).resolves.toBe("");
		});

		it("passes the command and args to spawn", async () => {
			mockedSpawn.mockReturnValue(makeMockChild("output", "", 0));
			await runCommand("git", ["status"], {});
			expect(mockedSpawn).toHaveBeenCalledWith("git", ["status"], expect.anything());
		});

		it("logs the command when watch is true", async () => {
			mockedSpawn.mockReturnValue(makeMockChild("output", "", 0));
			await runCommand("git", ["status"], { watch: true });
			expect(mockLog.start).toHaveBeenCalledWith(expect.stringContaining("git status"));
		});
	});

	describe("failure — non-silent", () => {
		it("calls process.exit with code 1", async () => {
			mockedSpawn.mockReturnValue(makeMockChild("", "error output", 1));
			await runCommand("git", ["status"], {});
			expect(exitSpy).toHaveBeenCalledWith(1);
		});

		it("logs the provided error message to stderr", async () => {
			mockedSpawn.mockReturnValue(makeMockChild("", "cmd failed", 1));
			await runCommand("git", ["status"], { error: { message: "git failed" } });
			expect(mockLog.error).toHaveBeenCalledWith("git failed");
		});

		it("falls back to the stderr content when no custom message is provided", async () => {
			mockedSpawn.mockReturnValue(makeMockChild("", "stderr message", 1));
			await runCommand("git", ["status"], {});
			expect(mockLog.error).toHaveBeenCalledWith(
				expect.objectContaining({ message: "stderr message" }),
			);
		});

		it("uses a generic exit code message when stderr is empty and no message is provided", async () => {
			mockedSpawn.mockReturnValue(makeMockChild("", "", 1));
			await runCommand("git", ["status"], {});
			expect(mockLog.error).toHaveBeenCalledWith(
				expect.objectContaining({
					message: expect.stringContaining("exit code 1") as string,
				}) as Error,
			);
		});

		// watch is left off deliberately — the hint must survive the default silent path,
		// where every log method except error is a no-op.
		it("logs the example on the error channel when provided", async () => {
			mockedSpawn.mockReturnValue(makeMockChild("", "cmd failed", 1));
			await runCommand("git", ["config", "user.name"], {
				error: { message: "user.name not set", example: 'git config user.name "Name"' },
			});
			expect(mockLog.error).toHaveBeenCalledWith("user.name not set");
			expect(mockLog.error).toHaveBeenCalledWith('Run: git config user.name "Name"');
			expect(mockLog.info).not.toHaveBeenCalled();
		});
	});

	describe("failure — silent", () => {
		it("re-throws the error", async () => {
			mockedSpawn.mockReturnValue(makeMockChild("", "silent failure", 1));
			await expect(runCommand("git", ["status"], { error: { silent: true } })).rejects.toThrow(
				"silent failure",
			);
		});

		it("does not log anything to stderr", async () => {
			mockedSpawn.mockReturnValue(makeMockChild("", "silent failure", 1));
			try {
				await runCommand("git", ["status"], { error: { silent: true } });
			} catch {
				/* ignore */
			}
			expect(errorSpy).not.toHaveBeenCalled();
		});

		it("does not call process.exit", async () => {
			mockedSpawn.mockReturnValue(makeMockChild("", "silent failure", 1));
			try {
				await runCommand("git", ["status"], { error: { silent: true } });
			} catch {
				/* ignore */
			}
			expect(exitSpy).not.toHaveBeenCalled();
		});
	});
});
