import eslint from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores([
    'dist/',
    '.wrangler/',
    'types/',
    'src/generated/',
    'docs/.phyllo/',
    'docs/dist/',
  ]),
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      curly: 'error',
      'no-void': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
    },
  },
);
