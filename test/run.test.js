/* eslint-disable no-shadow */

'use strict';

const test = require('tape');

const { cliWrapper } = require('../test/test-utils');

test('list command', async (t) => {
	t.plan(5);
	t.test('output to have correct columns', async (t) => {
		const wrapper = cliWrapper();
		const result = wrapper.run(['list']);
		const tableColumns = ['Repository', 'Access', 'DefBranch'];
		t.ok(tableColumns.every((column) => result.stdout.includes(column)));
		t.end();
	});

	t.test('output to have correct rows', (t) => {
		const wrapper = cliWrapper();
		const result = wrapper.run(['list', '-g', 'Access']);
		const tableRows = ['ADMIN', 'WRITE', 'READ', 'MAINTAIN'];
		t.ok(tableRows.some((row) => result.stdout.includes(row)));
		t.end();
	});

	t.test('field output to be correct', (t) => {
		const wrapper = cliWrapper();
		const result = wrapper.run(['list', '-f']);
		const fields = '- Repository\n- Access\n- DefBranch\n- isPrivate\n';
		t.equal(result.stdout, fields);
		t.end();
	});

	t.test('output should be sorted', (t) => {
		const wrapper = cliWrapper();
		const result = wrapper.run(['list', '-s']);
		// assertion

		// console.log(result.stdout);
		t.end();
	});

	t.test('output the help info', (t) => {
		const wrapper = cliWrapper();
		const result = wrapper.run(['list', '-h']);
		const helpInfo = ['--version', '-group-by', '--fields', '--sort', '--help'];
		t.ok(helpInfo.every((info) => result.stdout.includes(info)));
		t.end();
	});
});

test('options command', async (t) => {
	t.plan(5);
	t.test('output to have correct columns', async (t) => {
		const wrapper = cliWrapper();
		const result = wrapper.run(['options']);
		const tableColumns = ['Repository', 'Wiki', 'Projects', 'securityPolicy', 'mergeCommit', 'squashMerge', 'rebaseMerge', 'deleteOnMerge'];
		t.ok(tableColumns.every((column) => result.stdout.includes(column)));
		t.end();
	});

	t.test('output to have correct rows', (t) => {
		const wrapper = cliWrapper();
		const result = wrapper.run(['options', '-g', 'Wiki']);
		const tableRows = [' ✔', '✖'];
		t.ok(tableRows.some((row) => result.stdout.includes(row)));
		t.end();
	});

	t.test('field output to be correct', (t) => {
		const wrapper = cliWrapper();
		const result = wrapper.run(['options', '-f']);
		const fields = '- Repository\n- Wiki\n- Projects\n- securityPolicy\n- mergeCommit\n- squashMerge\n- rebaseMerge\n- deleteOnMerge\n- isPrivate\n';
		t.equal(result.stdout, fields);
		t.end();
	});

	t.test('output should be sorted', (t) => {
		const wrapper = cliWrapper();
		const result = wrapper.run(['options', '-s']);
		// assertion

		// console.log(result.stdout);
		t.end();
	});

	t.test('output the help info', (t) => {
		const wrapper = cliWrapper();
		const result = wrapper.run(['options', '-h']);
		const helpInfo = ['--version', '-group-by', '--fields', '--sort', '--help'];
		t.ok(helpInfo.every((info) => result.stdout.includes(info)));
		t.end();
	});
});

test('branchProtection command', async (t) => {
	t.plan(5);
	t.test('output to have correct columns', async (t) => {
		const wrapper = cliWrapper();
		const result = wrapper.run(['branchProtection']);
		const tableColumns = ['Repository', 'DefBranch', 'AllowsForcePushes', 'AllowsDeletions', 'DismissesStaleReviews', 'ReqApprovingReviewCount', 'ReqApprovingReviews', 'ReqCodeOwnerReviews'];
		t.ok(tableColumns.every((column) => result.stdout.includes(column)));
		t.end();
	});

	t.test('output to have correct rows', (t) => {
		const wrapper = cliWrapper();
		const result = wrapper.run(['branchProtection', '-g', 'Wiki']);
		const tableRows = [' ✔', '✖'];
		t.ok(tableRows.some((row) => result.stdout.includes(row)));
		t.end();
	});

	t.test('field output to be correct', (t) => {
		const wrapper = cliWrapper();
		const result = wrapper.run(['branchProtection', '-f']);
		const fields = '- Repository\n- DefBranch\n- AllowsForcePushes\n- AllowsDeletions\n- DismissesStaleReviews\n- ReqApprovingReviewCount\n- ReqApprovingReviews\n- ReqCodeOwnerReviews\n- isPrivate\n';
		t.equal(result.stdout, fields);
		t.end();
	});

	t.test('output should be sorted', (t) => {
		const wrapper = cliWrapper();
		const result = wrapper.run(['branchProtection', '-s']);
		// assertion

		// console.log(result.stdout);
		t.end();
	});

	t.test('output the help info', (t) => {
		const wrapper = cliWrapper();
		const result = wrapper.run(['branchProtection', '-h']);
		const helpInfo = ['--version', '-group-by', '--fields', '--help'];
		t.ok(helpInfo.every((info) => result.stdout.includes(info)));
		t.end();
	});
});

test('detail command', async (t) => {
	t.plan(5);
	t.test('output to have correct columns', async (t) => {
		const wrapper = cliWrapper();
		const result = wrapper.run(['detail']);
		const tableColumns = ['Repository', 'Access', 'IssuesEnabled', 'ProjectsEnabled', 'WikiEnabled', 'Archived', 'BlankIssuesEnabled', 'SecurityPolicyEnabled', 'License', 'Merge Strategies', 'DeleteOnMerge', 'HasStarred', 'Subscription', 'DefBranch', 'AllowsForcePushes', 'AllowsDeletions', 'DismissesStaleReviews', 'ReqApprovingReviewCount', 'ReqApprovingReviews', 'ReqCodeOwnerReviews', 'isPrivate'];
		t.ok(tableColumns.every((column) => result.stdout.includes(column)));
		t.end();
	});

	t.test('output to have correct rows', (t) => {
		const wrapper = cliWrapper();
		const result = wrapper.run(['detail', '-g', 'Wiki']);
		const tableRows = [' ✔', '✖'];
		t.ok(tableRows.some((row) => result.stdout.includes(row)));
		t.end();
	});

	t.test('field output to be correct', (t) => {
		const wrapper = cliWrapper();
		const result = wrapper.run(['detail', '-f']);
		const fields = '- Repository\n- DefBranch\n- AllowsForcePushes\n- AllowsDeletions\n- DismissesStaleReviews\n- ReqApprovingReviewCount\n- ReqApprovingReviews\n- ReqCodeOwnerReviews\n- isPrivate\n';
		t.equal(result.stdout, fields);
		t.end();
	});

	t.test('output should be sorted', (t) => {
		const wrapper = cliWrapper();
		const result = wrapper.run(['detail', '-s']);
		// assertion

		// console.log(result.stdout);
		t.end();
	});

	t.test('output the help info', (t) => {
		const wrapper = cliWrapper();
		const result = wrapper.run(['detail', '-h']);
		const helpInfo = ['--version', '-group-by', '--fields', '--help'];
		t.ok(helpInfo.every((info) => result.stdout.includes(info)));
		t.end();
	});
});

