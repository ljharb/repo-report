import ljharbConfig from '@ljharb/eslint-config/flat/node/18';

const maxComplexity = 30;
const maxLinesPerFunction = 100;

export default [
	...ljharbConfig,
	{
		rules: {
			'array-bracket-newline': 'off',
			complexity: ['error', maxComplexity],
			'func-style': 'off',
			'id-length': 'off',
			'linebreak-style': 'off',
			'max-lines': 'off',
			'max-lines-per-function': ['error', {
				max: maxLinesPerFunction,
				skipBlankLines: true,
				skipComments: true,
			}],
			'max-params': 'off',
			'max-statements': 'off',
		},
	},
	{
		files: ['test/**/*'],
		rules: {
			'no-unused-vars': ['error', { ignoreRestSiblings: true }],
		},
	},
];
