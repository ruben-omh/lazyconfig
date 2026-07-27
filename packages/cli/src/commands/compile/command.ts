import type { YargsCommandModule } from "../../types";
import { typesCommand } from "./sub-commands";

const command: YargsCommandModule = {
	command: "compile <command>",
	describe: "Compiler commands for use in build pipelines",

	builder: (yargs) => yargs.usage("$0 compile <command> [options]").command(typesCommand).strict(),

	handler: () => {},
};

export default command;
