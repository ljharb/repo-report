'use strict';

module.exports = async function loadingIndicator(task) {
	process.stderr.write('Loading...');
	const timer = setInterval(
		() => { process.stderr.write('.'); },
		1e3,
	);
	try {
		return await task();
	} finally {
		clearInterval(timer);
		if (process.stderr.clearLine) {
			process.stderr.clearLine(0);
			process.stderr.cursorTo(0);
		}
		process.stderr.write('\n');
	}
};
