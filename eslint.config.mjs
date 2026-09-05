import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'bin/**',
      'json/**',
      'node_modules/**',
      'tests/fixtures/**',
    ],
  },
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
);
