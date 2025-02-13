module.exports = {
  parser: '@typescript-eslint/parser', // Specifies the ESLint parser
  extends: [
    'airbnb-base', // Uses Airbnb's base JavaScript style guide
    'airbnb-typescript/base', // Uses Airbnb's TypeScript style guide
  ],
  parserOptions: {
    project: './tsconfig.json', // Path to your TypeScript configuration
  },
  plugins: [
    '@typescript-eslint', // Enables TypeScript-specific linting rules
    'import', // Ensures ESLint can find the import plugin
  ],
  env: {
    node: true, // Enables Node.js global variables and Node.js scoping
    es2021: true, // Enables ES2021 features
  },
  rules: {
    // Disallow extra blank lines
    'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],
    // Customize or add other rules as needed
    'max-len': ['error', { code: 125 }],
    // Allow console statements (useful for Node.js servers)
    'no-console': 'off',
    // Disable the rule that disallows circular dependencies
    'import/no-cycle': 'off',
  },
};
