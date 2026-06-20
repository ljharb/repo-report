export type RequiredStatusCheck = {
	app: { id: string } | null;
};

export type BranchProtectionRule = {
	allowsForcePushes: boolean;
	allowsDeletions: boolean;
	dismissesStaleReviews: boolean;
	requiredApprovingReviewCount: number;
	requiresApprovingReviews: boolean;
	requiresCodeOwnerReviews: boolean;
	requiresConversationResolution: boolean;
	restrictsPushes: boolean;
	requireLastPushApproval: boolean;
	requiresStrictStatusChecks: boolean;
	requiredStatusChecks: RequiredStatusCheck[];
};

export type Repository = {
	name: string;
	nameWithOwner: string;
	defaultBranchRef: {
		name: string;
		branchProtectionRule: BranchProtectionRule | null;
	} | null;
	deleteBranchOnMerge: boolean;
	hasIssuesEnabled: boolean;
	hasProjectsEnabled: boolean;
	hasDiscussionsEnabled: boolean;
	hasWikiEnabled: boolean;
	webCommitSignoffRequired: boolean;
	forkingAllowed: boolean;
	isArchived: boolean;
	autoMergeAllowed: boolean;
	squashMergeCommitTitle: string;
	isBlankIssuesEnabled: boolean;
	isFork: boolean;
	isPrivate: boolean;
	isSecurityPolicyEnabled: boolean;
	codeOfConduct: { name: string } | null;
	isTemplate: boolean;
	licenseInfo: { name: string } | null;
	mergeCommitAllowed: boolean;
	owner: { login: string };
	rebaseMergeAllowed: boolean;
	squashMergeAllowed: boolean;
	createdAt: string;
	updatedAt: string;
	pushedAt: string;
	viewerHasStarred: boolean;
	viewerPermission: string;
	viewerSubscription: string;
	fundingLinks: { platform: string, url: string }[];
};

export type Points = {
	cost: number;
	remaining?: number;
};

export type MetricValue = string | number | boolean | null | undefined;

export type MergeStrategiesConfig = {
	MERGE?: boolean | null;
	SQUASH?: boolean | null;
	REBASE?: boolean | null;
};

export type MetricConfigValue =
	| string
	| number
	| boolean
	| null
	| readonly (string | null)[]
	| MergeStrategiesConfig;

export type Metric<Config = MetricConfigValue> = {
	name?: string;
	dontPrint?: boolean;
	permissions?: string[];
	extract: (item: Repository) => MetricValue;
	compare?(item: Repository, config?: Config): boolean | null | undefined;
};

export type NamedMetric = Metric & { name: string };

export type Metrics = Record<string, Metric> & {
	Access: Metric<readonly string[]>;
	License: Metric<readonly (string | null)[]>;
	Subscription: Metric<readonly string[]>;
	SecurityPolicyEnabled: Metric<boolean>;
	RequiredBranchProtectionSourcePercentage: Metric<number>;
	MergeStrategies: Metric<MergeStrategiesConfig>;
	CodeOfConduct: Metric<boolean | string | readonly (string | null)[]>;
};

export type Flags = {
	config?: string;
	token?: string;
	json?: boolean;
	focus?: string[];
	f?: string[];
	names?: boolean;
	sort?: string;
	s?: string;
	desc?: boolean;
	cache?: boolean;
	cacheDir?: string;
	all?: boolean;
	pick?: string[];
	p?: string[];
	m?: boolean;
	metrics?: boolean;
	unactionable?: boolean;
	actual?: boolean;
	goodness?: boolean;
};

export type ConfigOverride = {
	repos: string | string[];
	metrics?: Record<string, MetricConfigValue>;
};

export type Config = {
	metrics: Record<string, MetricConfigValue>;
	overrides: ConfigOverride[];
	repositories: {
		focus?: string | string[];
		ignore?: string | string[];
	};
};

export type ValidationResult = { valid: true, error?: undefined } | { valid: false, error: string };
