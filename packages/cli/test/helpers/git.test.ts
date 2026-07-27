import { getCurrentBranch, getExactTag, isBehindRemote } from "../../src/helpers/git";
import { runCommandSync } from "../../src/helpers/run-command";

jest.mock("../../src/helpers/run-command");

const mockedRunCommandSync = jest.mocked(runCommandSync);

afterEach(() => {
	jest.resetAllMocks();
});

// ---------------------------------------------------------------------------
// getCurrentBranch
// ---------------------------------------------------------------------------

describe("getCurrentBranch", () => {
	it("returns the current branch name", () => {
		mockedRunCommandSync.mockReturnValue("feat/my-feature");
		expect(getCurrentBranch()).toBe("feat/my-feature");
	});

	it("returns HEAD in detached HEAD state", () => {
		mockedRunCommandSync.mockReturnValue("HEAD");
		expect(getCurrentBranch()).toBe("HEAD");
	});

	it("returns HEAD when the command fails (unborn branch or outside git repo)", () => {
		mockedRunCommandSync.mockImplementation(() => {
			throw new Error("not a git repo");
		});
		expect(getCurrentBranch()).toBe("HEAD");
	});

	it("calls git rev-parse --abbrev-ref HEAD", () => {
		mockedRunCommandSync.mockReturnValue("main");
		getCurrentBranch();
		expect(mockedRunCommandSync).toHaveBeenCalledWith(
			"git",
			["rev-parse", "--abbrev-ref", "HEAD"],
			expect.anything(),
		);
	});

	it("forwards the watch option to runCommandSync", () => {
		mockedRunCommandSync.mockReturnValue("main");
		getCurrentBranch({ watch: true });
		expect(mockedRunCommandSync).toHaveBeenCalledWith(
			expect.anything(),
			expect.anything(),
			expect.objectContaining({ watch: true }),
		);
	});
});

// ---------------------------------------------------------------------------
// getExactTag
// ---------------------------------------------------------------------------

describe("getExactTag", () => {
	it("returns the tag name when HEAD is exactly tagged", () => {
		mockedRunCommandSync.mockReturnValue("v1.0.0");
		expect(getExactTag()).toBe("v1.0.0");
	});

	it("returns undefined when HEAD is not exactly tagged", () => {
		mockedRunCommandSync.mockImplementation(() => {
			throw new Error("no tag");
		});
		expect(getExactTag()).toBeUndefined();
	});

	it("calls git describe --exact-match --tags HEAD", () => {
		mockedRunCommandSync.mockReturnValue("v2.3.0");
		getExactTag();
		expect(mockedRunCommandSync).toHaveBeenCalledWith(
			"git",
			["describe", "--exact-match", "--tags", "HEAD"],
			expect.objectContaining({ error: { silent: true } }),
		);
	});

	it("forwards the watch option to runCommandSync", () => {
		mockedRunCommandSync.mockReturnValue("v1.0.0");
		getExactTag({ watch: true });
		expect(mockedRunCommandSync).toHaveBeenCalledWith(
			expect.anything(),
			expect.anything(),
			expect.objectContaining({ watch: true }),
		);
	});
});

// ---------------------------------------------------------------------------
// isBehindRemote
// ---------------------------------------------------------------------------

describe("isBehindRemote", () => {
	it("returns true when the local branch is behind the remote", () => {
		mockedRunCommandSync.mockReturnValue("3");
		expect(isBehindRemote()).toBe(true);
	});

	it("returns false when the local branch is up to date", () => {
		mockedRunCommandSync.mockReturnValue("0");
		expect(isBehindRemote()).toBe(false);
	});

	it("returns false when no upstream is configured", () => {
		mockedRunCommandSync.mockImplementation(() => {
			throw new Error("no upstream");
		});
		expect(isBehindRemote()).toBe(false);
	});

	it("returns false when in detached HEAD state", () => {
		mockedRunCommandSync.mockImplementation(() => {
			throw new Error("detached HEAD");
		});
		expect(isBehindRemote()).toBe(false);
	});

	it("returns false for a non-integer count value", () => {
		mockedRunCommandSync.mockReturnValue("not-a-number");
		expect(isBehindRemote()).toBe(false);
	});

	it("calls git rev-list --count HEAD..@{u}", () => {
		mockedRunCommandSync.mockReturnValue("0");
		isBehindRemote();
		expect(mockedRunCommandSync).toHaveBeenCalledWith(
			"git",
			["rev-list", "--count", "HEAD..@{u}"],
			expect.objectContaining({ error: { silent: true } }),
		);
	});

	it("forwards the watch option to runCommandSync", () => {
		mockedRunCommandSync.mockReturnValue("0");
		isBehindRemote({ watch: true });
		expect(mockedRunCommandSync).toHaveBeenCalledWith(
			expect.anything(),
			expect.anything(),
			expect.objectContaining({ watch: true }),
		);
	});
});
