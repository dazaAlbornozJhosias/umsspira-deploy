module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2021, sourceType: 'module' },
  env: { node: true, es2021: true },
  extends: ['eslint:recommended'],
  ignorePatterns: ['dist/', 'node_modules/'],
  rules: {
    // Las reglas base de ESLint no interpretan tipos y firmas de TypeScript.
    // El compilador comprueba identificadores y tipos mediante tsc.
    'no-undef': 'off',
    'no-unused-vars': 'off',
  },
};
