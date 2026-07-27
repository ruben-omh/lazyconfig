import type { StdioOptions } from "node:child_process";
import type { CommandModule } from "yargs";

/**
 * Convenience alias for the yargs `CommandModule` type with optional generic overrides.
 *
 * @template T - Type of the parsed options object passed to `builder`. Defaults to `{}`.
 * @template A - Type of the parsed arguments object passed to `handler`. Defaults to `{}`.
 */
export type YargsCommandModule<T = object, A = object> = CommandModule<T, A>;

/**
 * Base options shared across all hook script functions.
 *
 * Extend this interface when defining options for a new script to inherit
 * `watch` without redeclaring it.
 */
export interface DefaultScriptOptions {
	/**
	 * When `true`, emits informational log messages for each step executed.
	 * Useful for debugging hook behaviour. Defaults to `false`.
	 */
	watch?: boolean;
}

/**
 * Options forwarded to {@linkcode runCommand} and {@linkcode runCommandSync} to control
 * how a child process is spawned and how failures are reported.
 */
export interface CommandOptions extends DefaultScriptOptions {
	/**
	 * stdio mode forwarded to the child process.
	 * Use `"inherit"` to stream output directly to the terminal (stdout/stderr are not captured).
	 * Defaults to `"pipe"`.
	 */
	stdio?: StdioOptions;
	/**
	 * Output encoding forwarded to the child process.
	 * Determines how raw stdout bytes are decoded into a string.
	 * Defaults to `"utf-8"`.
	 */
	encoding?: BufferEncoding;
	/**
	 * Controls how command failures are reported to the caller.
	 * When omitted, failures log to stderr and exit with code 1.
	 */
	error?: {
		/**
		 * Human-readable description of what went wrong, shown to the user on failure.
		 * Falls back to the raw error message when omitted.
		 */
		message?: string;
		/**
		 * When `true`, suppresses stderr output and re-throws the raw error so the caller
		 * can handle it instead. Defaults to `false`.
		 */
		silent?: boolean;
		/**
		 * Example command shown to the user after the error message to help resolve the failure.
		 *
		 * @example
		 * ```ts
		 * error: { example: 'git config user.name "Your Name"' }
		 * ```
		 */
		example?: string;
	};
}

/**
 * Options for {@linkcode commitSignoff}.
 */
export interface CommitSignoffOptions extends DefaultScriptOptions {
	/**
	 * Path to the commit message file. Git passes this as `$1` in the
	 * `prepare-commit-msg` hook. Defaults to `$GIT_DIR/COMMIT_EDITMSG`.
	 * In git worktrees the path differs (e.g. `.git/worktrees/<name>/COMMIT_EDITMSG`),
	 * so always prefer forwarding the value git provides rather than relying on the default.
	 */
	msgFile?: string;
}

/**
 * Options for {@linkcode types}.
 */
export interface TypesOptions extends DefaultScriptOptions {
	/**
	 * One or more tsconfig file paths passed to `tsc --emitDeclarationOnly`.
	 * Each file produces a separate declaration emit pass.
	 * Defaults to `["tsconfig.json"]`.
	 */
	tsc?: string[];

	/**
	 * One or more api-extractor config file paths.
	 * Each file produces a separate declaration bundle.
	 * Defaults to `["api-extractor.json"]`.
	 */
	aec?: string[];

	/**
	 * Additional declaration file extensions to emit alongside the base `.d.ts`
	 * rollup. Each entry is a bare extension token (e.g. `"mts"`, `"cts"`); the
	 * script copies each rollup to a `.d.<ext>` counterpart.
	 *
	 * Useful for dual-package setups where the ESM (`"import"`) and CJS
	 * (`"require"`) export conditions need to point to format-specific typings
	 * (`.d.mts` / `.d.cts`) to satisfy `moduleResolution: "nodenext"`.
	 *
	 * Defaults to `[]` (no additional copies).
	 */
	ext?: string[];
}
