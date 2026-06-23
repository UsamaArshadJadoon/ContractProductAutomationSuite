// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      'node_modules/',
      'test-results/',
      'playwright-report/',
      'blob-report/',
      'healing-report/',
      '.auth/',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['tests/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // Assertions in strict POM live in page-object helpers named `expect*`
      // (e.g. dashboard.expectLoaded()). The rule matches on the method name,
      // so a regex pattern on the property name counts those as assertions.
      'playwright/expect-expect': [
        'error',
        { assertFunctionNames: ['expect'], assertFunctionPatterns: ['^expect'] },
      ],
    },
  },
  {
    // The auth setup is a special case: it legitimately branches on whether a
    // session already exists (setup.skip) and throttles against a server-side
    // rate limit (waitForTimeout). Neither applies to ordinary tests.
    files: ['tests/auth.setup.ts'],
    rules: {
      'playwright/no-conditional-in-test': 'off',
      'playwright/no-wait-for-timeout': 'off',
      'playwright/no-skipped-test': 'off',
    },
  },
  {
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  prettier,
);
