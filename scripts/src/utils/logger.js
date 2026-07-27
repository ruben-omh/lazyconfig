"use strict";

const { createConsola } = require("consola");

const rootLogger = createConsola({
	level: 4,
	formatOptions: {
		date: false,
		colors: true,
		compact: false,
	},
}).withTag("@lazyconfig/scripts");

function createLogger(prefix) {
	const logger = rootLogger.withTag(prefix);

	return {
		start: (message) => logger.start(message),
		success: (message) => logger.success(message),
		info: (message) => logger.info(message),
		warn: (message) => logger.warn(message),
		box: (message) => logger.box(message),
		error: (error) => {
			logger.error(error);
			process.exit(1);
		},
	};
}

module.exports = createLogger;
