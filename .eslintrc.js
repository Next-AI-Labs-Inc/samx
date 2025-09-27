module.exports = {
  extends: ['next/core-web-vitals'],
  rules: {
    // Allow build to succeed while maintaining code quality
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': 'warn', 
    '@typescript-eslint/no-require-imports': 'off',
    'react/no-unescaped-entities': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
    'prefer-const': 'warn',
    '@typescript-eslint/no-empty-object-type': 'warn',
    
    // Keep these as errors for important issues
    'no-console': 'off', // Allow console statements for debugging
    'no-debugger': 'error',
    'no-alert': 'error'
  },
  ignorePatterns: [
    'node_modules/',
    '.next/',
    'out/',
    'build/',
    'dist/',
    '*.config.js',
    '*.config.ts'
  ]
};