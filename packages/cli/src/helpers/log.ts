import { createConsola } from "consola";

/**
 * Root consola instance for the `@lazyconfig/cli` package.
 *
 * All per-script loggers are derived from this instance via `withTag`, so every
 * log line is automatically scoped to `[@lazyconfig/cli]` without any manual prefixing.
 * Timestamps are disabled to keep hook output concise.
 */
const rootLogger = createConsola({
	level: 4,
	formatOptions: {
		date: false,
		colors: true,
		compact: false,
	},
}).withTag("@lazyconfig/cli");

/**
 * Creates a scoped logger for a named script step.
 *
 * Internally calls `rootLogger.withTag(prefix)`, which causes consola to render every
 * log line with the tag `[@lazyconfig/cli:<prefix>]`. This gives each function its own
 * visual scope in the terminal without any manual message formatting.
 *
 * When `watch` is `false`, `start`, `success`, `info`, and `warn` are silent no-ops.
 * The `error` method **always** logs regardless of `watch` — it is used to surface
 * fatal failures that must always be visible to the user.
 *
 * @param prefix - Script name used as the consola sub-tag (e.g. `"commit-signoff"`).
 *   Combined with the root tag, the rendered tag becomes `[@lazyconfig/cli:commit-signoff]`.
 * @param watch  - When `true`, all log methods are active. When `false`, only `error` logs.
 * @returns An object with `start`, `success`, `info`, `warn`, and `error` log methods.
 *
 * @example
 * ```ts
 * const log = createLogger("my-script", watch);
 *
 * log.start("Downloading…");   // ◐ [@lazyconfig/cli:my-script] Downloading…
 * log.success("Done.");        // ✔ [@lazyconfig/cli:my-script] Done.
 * log.info("Skipping.");       // ℹ [@lazyconfig/cli:my-script] Skipping.
 * log.warn("Deprecated.");     //   [@lazyconfig/cli:my-script] WARN  Deprecated.
 * log.error("Failed.");        // ✖ [@lazyconfig/cli:my-script] Failed.
 * ```
 */
export function createLogger(
	prefix: string,
	watch: boolean,
): {
	start: (message: string) => void;
	success: (message: string) => void;
	info: (message: string) => void;
	warn: (message: string) => void;
	error: (error: string | Error) => void;
} {
	const log = rootLogger.withTag(prefix);

	const errFn = (error: string | Error): void => {
		log.error(error);
	};

	if (!watch)
		return {
			start: () => {},
			success: () => {},
			info: () => {},
			warn: () => {},
			error: errFn,
		};

	return {
		start: (message: string) => log.start(message),
		success: (message: string) => log.success(message),
		info: (message: string) => log.info(message),
		warn: (message: string) => log.warn(message),
		error: errFn,
	};
}
