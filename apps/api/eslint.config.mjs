import tseslint from 'typescript-eslint';

export default tseslint.config(
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/shared/lib/supabase.spec.ts'],
    rules: {
      // El spec recarga el módulo después de jest.resetModules() para aislar los clientes.
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
);
