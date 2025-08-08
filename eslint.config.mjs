import js from '@eslint/js';
import globals from 'globals';
import { defineConfig } from 'eslint/config';

export default defineConfig([
	{
		extends: ['js/recommended'], files: ['**/*.{js,mjs,cjs}'], plugins: { js },
	},
	{ files: ['**/*.{js,mjs,cjs}'], languageOptions: { globals: globals.browser } },
]);
