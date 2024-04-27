import eslint from '@eslint/js';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import unusedImportsPlugin from 'eslint-plugin-unused-imports';
import globals from 'globals';

const nodePackagesWithoutPrefix = [
  'error',
  'assert',
  'assert/strict',
  'async_hooks',
  'buffer',
  'child_process',
  'cluster',
  'crypto',
  'dns',
  'events',
  'fs',
  'fs/promises',
  'http',
  'http2',
  'https',
  'inspector',
  'module',
  'net',
  'os',
  'path',
  'perf_hooks',
  'process',
  'querystring',
  'readline',
  'readline/promises',
  'repl',
  'stream',
  'stream/web',
  'string_decoder',
  'timers',
  'timers/promises',
  'tls',
  'trace_events',
  'tty',
  'dgram',
  'url',
  'util',
  '"v8"',
  'vm',
  'worker_threads',
  'zlib'
];

/** @type { import("eslint").Linter.FlatConfig[] } */
export default [
  {
    ignores: ['**/dist/**', '**/build/**', '**/cdk.out/**', './eslint.config.js']
  },
  {
    files: ['**/*.ts', '**/*.js', '**/*.mjs', '**/*.cjs'],
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      'unused-imports': unusedImportsPlugin
    },
    languageOptions: {
      parser: typescriptParser,
      globals: {
        ...globals.node
      }
    },
    rules: {
      ...eslint.configs.recommended.rules,
      ...typescriptPlugin.configs['recommended'].rules,
      'no-restricted-imports': nodePackagesWithoutPrefix,
      'unused-imports/no-unused-imports-ts': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn'
    }
  },
  prettierConfig
];
