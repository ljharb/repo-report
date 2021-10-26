'use strict';

const Metrics = require('../config/metrics.js');

const cmpAccess = (item, config) => config.includes(item.viewerPermission);
const cmpLicense = (item, config) => config.includes(item.licenseInfo?.name || null);
const cmpSubscription = (item, config) => config.includes(item.viewerSubscription);

/* eslint-disable */
const cmpMergeStrategies = (item, config) => {
	return (config.MERGE === undefined || config.MERGE === item.mergeCommitAllowed)
		&& (config.SQUASH === undefined || config.SQUASH === item.squashMergeAllowed)
		&& (config.REBASE === undefined || config.REBASE === item.rebaseMergeAllowed);
};
/* eslint-enable */

const compareMethods = {
	Access: cmpAccess,
	License: cmpLicense,
	MergeStrategies: cmpMergeStrategies,
	Subscription: cmpSubscription,
};

const dontPrint = {
	isFork: true,
	isPrivate: true,
};

const getMetrics = (metrics) => {
	const out = metrics.map((name) => {
		const { permissions, extract } = Metrics[name];
		return {
			compare: compareMethods[name],
			dontPrint: dontPrint[name],
			extract,
			name,
			permissions: permissions?.[name],
		};
	});
	return out;
};

module.exports = { getMetrics };
