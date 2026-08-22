import { commitSignoff } from "../../../../src/commands/hook/sub-commands/scripts/commit-signoff";
import { createLogger } from "../../../../src/helpers/log";
import { runCommandSync } from "../../../../src/helpers/run-command";

jest.mock("../../../../src/helpers/run-command");
jest.mock("../../../../src/helpers/log");

const mockedRunCommandSync = jest.mocked(runCommandSync);

const MSG_FILE = "/repo/.git/COMMIT_EDITMSG";
const USER_NAME = "Test User";
const USER_EMAIL = "test@example.com";
const TRAILER = `Signed-off-by: ${USER_NAME} <${USER_EMAIL}>`;

const mockLog = {
	start: jest.fn(),
	success: jest.fn(),
	info: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
};

// --- helpers ---

/** The argv of the `git interpret-trailers` invocation, or undefined if it never ran. */
function trailerCallArgs(): string[] | undefined {
	return mockedRunCommandSync.mock.calls.find(([, args]) => args[0] === "interpret-trailers")?.[1];
}

// --- tests ---

describe("commitSignoff", () => {
	beforeEach(() => {
		jest.mocked(createLogger).mockReturnValue(mockLog);
		mockedRunCommandSync.mockReturnValueOnce(USER_NAME).mockReturnValueOnce(USER_EMAIL);
	});

	afterEach(() => {
		jest.resetAllMocks();
		delete process.env.GIT_DIR;
	});

	describe("trailer injection", () => {
		it("adds the Signed-off-by trailer via git interpret-trailers", () => {
			commitSignoff({ msgFile: MSG_FILE });
			expect(trailerCallArgs()).toEqual([
				"interpret-trailers",
				"--in-place",
				"--if-exists",
				"addIfDifferent",
				"--trailer",
				TRAILER,
				MSG_FILE,
			]);
		});

		// Regression guard: the previous implementation appended to the end of the file,
		// which git discards under `git commit -v` (everything past the scissors line).
		it("edits the message in place rather than appending to the file", () => {
			commitSignoff({ msgFile: MSG_FILE });
			expect(trailerCallArgs()).toContain("--in-place");
		});

		it("uses addIfDifferent so repeat runs do not duplicate the trailer", () => {
			commitSignoff({ msgFile: MSG_FILE });
			const args = trailerCallArgs();
			expect(args?.[args.indexOf("--if-exists") + 1]).toBe("addIfDifferent");
		});

		it("targets the resolved commit message file", () => {
			commitSignoff({ msgFile: MSG_FILE });
			expect(trailerCallArgs()?.at(-1)).toBe(MSG_FILE);
		});

		it("surfaces a descriptive error when the trailer cannot be written", () => {
			commitSignoff({ msgFile: MSG_FILE });
			const opts = mockedRunCommandSync.mock.calls.find(
				([, args]) => args[0] === "interpret-trailers",
			)?.[2];
			expect(opts?.error?.message).toContain(MSG_FILE);
		});
	});

	describe("default commit message file path", () => {
		it("uses GIT_DIR env var to resolve the commit message file", () => {
			process.env.GIT_DIR = "/worktree/.git/worktrees/my-worktree";
			commitSignoff();
			expect(trailerCallArgs()?.at(-1)).toBe("/worktree/.git/worktrees/my-worktree/COMMIT_EDITMSG");
		});

		it("falls back to .git/COMMIT_EDITMSG when GIT_DIR is not set", () => {
			delete process.env.GIT_DIR;
			commitSignoff();
			expect(trailerCallArgs()?.at(-1)).toContain("COMMIT_EDITMSG");
		});
	});

	describe("git config", () => {
		it("reads user.name from git config", () => {
			commitSignoff({ msgFile: MSG_FILE });
			expect(mockedRunCommandSync).toHaveBeenCalledWith(
				"git",
				["config", "user.name"],
				expect.anything(),
			);
		});

		it("reads user.email from git config", () => {
			commitSignoff({ msgFile: MSG_FILE });
			expect(mockedRunCommandSync).toHaveBeenCalledWith(
				"git",
				["config", "user.email"],
				expect.anything(),
			);
		});

		it("builds the trailer from user.name and user.email", () => {
			commitSignoff({ msgFile: MSG_FILE });
			expect(trailerCallArgs()).toContain(`Signed-off-by: ${USER_NAME} <${USER_EMAIL}>`);
		});

		it("reads the git config before invoking interpret-trailers", () => {
			commitSignoff({ msgFile: MSG_FILE });
			const commands = mockedRunCommandSync.mock.calls.map(([, args]) => args[0]);
			expect(commands.lastIndexOf("config")).toBeLessThan(commands.indexOf("interpret-trailers"));
		});
	});

	describe("watch mode", () => {
		it("logs success when the trailer is added", () => {
			commitSignoff({ msgFile: MSG_FILE, watch: true });
			expect(mockLog.success).toHaveBeenCalled();
		});

		it("forwards watch to the interpret-trailers invocation", () => {
			commitSignoff({ msgFile: MSG_FILE, watch: true });
			const opts = mockedRunCommandSync.mock.calls.find(
				([, args]) => args[0] === "interpret-trailers",
			)?.[2];
			expect(opts).toMatchObject({ watch: true });
		});

		it("creates the logger with watch: false when watch is not set", () => {
			commitSignoff({ msgFile: MSG_FILE });
			expect(jest.mocked(createLogger)).toHaveBeenCalledWith("commit-signoff", false);
		});
	});
});
