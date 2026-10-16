import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'dist-test/**', 'node_modules/**', 'readme/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
);
