import tsEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import eslintConfigPrettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import prettierPlugin from 'eslint-plugin-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    plugins: {
      '@typescript-eslint': tsEslint,
      'prettier': prettierPlugin,
      'simple-import-sort': simpleImportSort,
      'import': importPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        node: true,
        es2020: true,
        jest: true,
      },
    },
    rules: {
      ...tsEslint.configs.recommended.rules,
      'prettier/prettier': [
        'error',
        {
          printWidth: 110,
        },
      ],
      'import/extensions': 'off',
      'import/namespace': 'off',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },
  eslintConfigPrettier,
  {
    files: ['babel.config.js'],
    languageOptions: {
      globals: {
        module: 'readonly',
        exports: 'readonly',
      },
    },
  },
  {
    ignores: [
      'lib/**/*',
      'node_modules/**/*',
      'coverage/**/*',
      'jest.config.ts',
      '**/*.test.ts',
    ],
  },
];