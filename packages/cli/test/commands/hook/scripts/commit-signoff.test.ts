import { readFileSync, writeFileSync } from "node:fs";
import { commitSignoff } from "../../../../src/commands/hook/sub-commands/scripts/commit-signoff";
import { createLogger } from "../../../../src/helpers/log";
import { runCommandSync } from "../../../../src/helpers/run-command";

jest.mock("node:fs");
jest.mock("../../../../src/helpers/run-command");
jest.mock("../../../../src/helpers/log");

const mockedReadFileSync = jest.mocked(readFileSync);
const mockedWriteFileSync = jest.mocked(writeFileSync);
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
		it("appends a Signed-off-by trailer to the commit message", () => {
			mockedReadFileSync.mockReturnValue("feat: add new feature\n");
			commitSignoff({ msgFile: MSG_FILE });
			expect(mockedWriteFileSync).toHaveBeenCalledWith(
				MSG_FILE,
				`feat: add new feature\n\n${TRAILER}\n`,
			);
		});

		it("skips writing when the trailer is already present", () => {
			mockedReadFileSync.mockReturnValue(`feat: add new feature\n\n${TRAILER}\n`);
			commitSignoff({ msgFile: MSG_FILE });
			expect(mockedWriteFileSync).not.toHaveBeenCalled();
		});

		it("inserts a blank line between the message body and the trailer", () => {
			mockedReadFileSync.mockReturnValue("feat: initial commit");
			commitSignoff({ msgFile: MSG_FILE });
			const written = mockedWriteFileSync.mock.calls[0]?.[1] as string;
			expect(written).toContain("\n\nSigned-off-by:");
		});

		it("trims trailing whitespace from the message before appending the trailer", () => {
			mockedReadFileSync.mockReturnValue("feat: initial commit\n\n\n");
			commitSignoff({ msgFile: MSG_FILE });
			const written = mockedWriteFileSync.mock.calls[0]?.[1] as string;
			expect(written).toBe(`feat: initial commit\n\n${TRAILER}\n`);
		});

		it("ends the written content with a newline", () => {
			mockedReadFileSync.mockReturnValue("feat: initial commit");
			commitSignoff({ msgFile: MSG_FILE });
			const written = mockedWriteFileSync.mock.calls[0]?.[1] as string;
			expect(written).toMatch(/\n$/);
		});
	});

	describe("default commit message file path", () => {
		it("uses GIT_DIR env var to resolve the commit message file", () => {
			process.env.GIT_DIR = "/worktree/.git/worktrees/my-worktree";
			mockedReadFileSync.mockReturnValue("feat: add feature\n");
			commitSignoff();
			expect(mockedReadFileSync).toHaveBeenCalledWith(
				"/worktree/.git/worktrees/my-worktree/COMMIT_EDITMSG",
				"utf-8",
			);
		});

		it("falls back to .git/COMMIT_EDITMSG when GIT_DIR is not set", () => {
			delete process.env.GIT_DIR;
			mockedReadFileSync.mockReturnValue("feat: add feature\n");
			commitSignoff();
			expect(mockedReadFileSync).toHaveBeenCalledWith(
				expect.stringContaining("COMMIT_EDITMSG"),
				"utf-8",
			);
		});
	});

	describe("git config", () => {
		it("reads user.name from git config", () => {
			mockedReadFileSync.mockReturnValue("feat: add feature\n");
			commitSignoff({ msgFile: MSG_FILE });
			expect(mockedRunCommandSync).toHaveBeenCalledWith(
				"git",
				["config", "user.name"],
				expect.anything(),
			);
		});

		it("reads user.email from git config", () => {
			mockedReadFileSync.mockReturnValue("feat: add feature\n");
			commitSignoff({ msgFile: MSG_FILE });
			expect(mockedRunCommandSync).toHaveBeenCalledWith(
				"git",
				["config", "user.email"],
				expect.anything(),
			);
		});

		it("builds the trailer from user.name and user.email", () => {
			mockedReadFileSync.mockReturnValue("feat: add feature\n");
			commitSignoff({ msgFile: MSG_FILE });
			const written = mockedWriteFileSync.mock.calls[0]?.[1] as string;
			expect(written).toContain(`Signed-off-by: ${USER_NAME} <${USER_EMAIL}>`);
		});
	});

	describe("watch mode", () => {
		it("logs success when the trailer is added", () => {
			mockedReadFileSync.mockReturnValue("feat: add feature\n");
			commitSignoff({ msgFile: MSG_FILE, watch: true });
			expect(mockLog.success).toHaveBeenCalled();
		});

		it("logs when the trailer is already present", () => {
			mockedReadFileSync.mockReturnValue(`feat: add feature\n\n${TRAILER}\n`);
			commitSignoff({ msgFile: MSG_FILE, watch: true });
			expect(mockLog.info).toHaveBeenCalledWith(expect.stringContaining("already present"));
		});

		it("creates the logger with watch: false when watch is not set", () => {
			mockedReadFileSync.mockReturnValue("feat: add feature\n");
			commitSignoff({ msgFile: MSG_FILE });
			expect(jest.mocked(createLogger)).toHaveBeenCalledWith("commit-signoff", false);
		});
	});
});
