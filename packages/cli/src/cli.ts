/**
 * @file CLI entry point for the `lazyconfig` command.
 *
 * Bootstraps the yargs instance with global flags (`--help`, `--version`) and
 * registers all top-level command namespaces. Each namespace is defined in its
 * own module under `src/commands/`.
 *
 * @example
 * ```sh
 * lazyconfig --help
 * lazyconfig --version
 * lazyconfig hook --help
 * lazyconfig hook commit-signoff -f "$1"
 * ```
 */

import { createRequire } from "node:module";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { createLogger } from "./helpers/log";
import hookCommand from "./commands/hook/command";
import compileCommand from "./commands/compile/command";

// createRequire is needed to load package.json in ESM — `import with { type: "json" }` requires
// an import attribute that SWC cannot emit when targeting CommonJS output.
const require = createRequire(import.meta.url);

// void suppresses the unhandled Promise warning — .parse() is async but top-level await
// is unavailable when SWC compiles to CommonJS.
void yargs()
	.scriptName("lazyconfig")
	.usage("$0 <command> [options]")
	.version((require("../package.json") as { version: string }).version)
	.alias("v", "version")
	.help()
	.alias("h", "help")
	.command(hookCommand)
	.command(compileCommand)
	.demandCommand(1, 'No command specified. Run "lazyconfig --help" to see available commands.')
	.strict()
	// yargs passes (msg, err): validation failures arrive as `msg` with `err` null, while a
	// rejected async command handler arrives as `msg === null` with the real error in `err`.
	// Reading only `msg` turned every async failure into a bare "ERROR null".
	.fail((msg, err) => {
		const logger = createLogger("cli", false);
		logger.error(msg ?? err);
		process.exit(1);
	})
	.parse(hideBin(process.argv));
