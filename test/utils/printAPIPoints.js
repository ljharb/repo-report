'use strict';

const test = require('tape');

const { stderr } = require('../test-utils');

const { printAPIPoints } = require('../../src/utils');

test('printAPIPoints', (t) => {
	t.test('returns the API points correctly', (st) => {
		const output = stderr();
		const expectedResults = ['API Points:\n  \tused\t\t-\t2\n  \tremaining\t-\t4997\n'];
		printAPIPoints({ cost: 2, remaining: 4997 });
		output.restore();
		st.deepEqual(output.loggedData, expectedResults);

		st.end();
	});

	t.test('checks if API points is not correct', (st) => {
		const output = stderr();
		const expectedResults = ['API Points:\n  \tused\t\t-\t3\n  \tremaining\t-\t4997\n'];

		printAPIPoints({ cost: 2, remaining: 4997 });
		output.restore();
		st.notDeepEqual(output.loggedData, expectedResults);

		st.end();
	});

	t.end();
});
