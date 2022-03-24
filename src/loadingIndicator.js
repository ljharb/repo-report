'use strict';

module.exports = async function loadingIndicator(task) {
	process.stdout.write('Loading...');
	const timer = setInterval(
		() => { process.stdout.write('.'); },
		1e3,
	);
	try {
		return await task();
	} finally {
		clearInterval(timer);
		process.stdout.clearLine(0);
		process.stdout.cursorTo(0);
	}
};
