// Mock consola before log.ts is imported so the module-level `createConsola(...).withTag()`
// chain receives our controlled instance. withTag is set to return the same instance so
// both the root logger and every per-prefix logger share a single spy surface.
jest.mock("consola", () => {
	const instance = {
		start: jest.fn(),
		success: jest.fn(),
		info: jest.fn(),
		warn: jest.fn(),
		error: jest.fn(),
		withTag: jest.fn(),
	};
	instance.withTag.mockReturnValue(instance);
	return { createConsola: jest.fn(() => instance) };
});

import { createConsola } from "consola";
import { createLogger } from "../../src/helpers/log";

// The singleton instance created at module load time by createConsola().
type MockLogger = {
	start: jest.Mock;
	success: jest.Mock;
	info: jest.Mock;
	warn: jest.Mock;
	error: jest.Mock;
	withTag: jest.Mock;
};
const mockLogger = jest.mocked(createConsola).mock.results[0]?.value as MockLogger;

describe("createLogger", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("returns an object with start, success, info, warn, and error methods", () => {
		const log = createLogger("test", false);
		expect(typeof log.start).toBe("function");
		expect(typeof log.success).toBe("function");
		expect(typeof log.info).toBe("function");
		expect(typeof log.warn).toBe("function");
		expect(typeof log.error).toBe("function");
	});

	it("creates a sub-tag for the given prefix", () => {
		createLogger("my-script", false);
		expect(mockLogger.withTag).toHaveBeenCalledWith("my-script");
	});

	describe("watch: false", () => {
		it("start is a no-op", () => {
			const log = createLogger("test", false);
			log.start("hello");
			expect(mockLogger.start).not.toHaveBeenCalled();
		});

		it("success is a no-op", () => {
			const log = createLogger("test", false);
			log.success("done");
			expect(mockLogger.success).not.toHaveBeenCalled();
		});

		it("info is a no-op", () => {
			const log = createLogger("test", false);
			log.info("message");
			expect(mockLogger.info).not.toHaveBeenCalled();
		});

		it("warn is a no-op", () => {
			const log = createLogger("test", false);
			log.warn("warning");
			expect(mockLogger.warn).not.toHaveBeenCalled();
		});

		it("error still logs regardless of watch", () => {
			const log = createLogger("test", false);
			log.error("something went wrong");
			expect(mockLogger.error).toHaveBeenCalled();
		});
	});

	describe("watch: true", () => {
		it("start calls the internal logger with the message", () => {
			const log = createLogger("my-script", true);
			log.start("starting up");
			expect(mockLogger.start).toHaveBeenCalledWith("starting up");
		});

		it("success calls the internal logger with the message", () => {
			const log = createLogger("my-script", true);
			log.success("all done");
			expect(mockLogger.success).toHaveBeenCalledWith("all done");
		});

		it("info calls the internal logger with the message", () => {
			const log = createLogger("my-script", true);
			log.info("something happened");
			expect(mockLogger.info).toHaveBeenCalledWith("something happened");
		});

		it("warn calls the internal logger with the message", () => {
			const log = createLogger("my-script", true);
			log.warn("take note");
			expect(mockLogger.warn).toHaveBeenCalledWith("take note");
		});

		it("error with a string calls the internal logger with the message", () => {
			const log = createLogger("my-script", true);
			log.error("bad things happened");
			expect(mockLogger.error).toHaveBeenCalledWith("bad things happened");
		});

		it("error with an Error instance forwards the Error object directly", () => {
			const log = createLogger("my-script", true);
			const err = new Error("raw error");
			log.error(err);
			expect(mockLogger.error).toHaveBeenCalledWith(err);
		});

		it("calls the internal logger once per invocation", () => {
			const log = createLogger("test", true);
			log.info("first");
			log.info("second");
			expect(mockLogger.info).toHaveBeenCalledTimes(2);
		});
	});
});
