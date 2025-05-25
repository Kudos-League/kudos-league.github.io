/** @type {import('eslint').Linter.Config} */
module.exports = {
    root: true,
    env: {
        browser: true,
        es2021: true,
        node: true
    },
    extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:@typescript-eslint/recommended'
        // 'plugin:prettier/recommended',
    ],
    parser: '@typescript-eslint/parser',
    plugins: ['react', '@typescript-eslint', 'prettier'],
    rules: {
        indent: ['error', 4],
        '@typescript-eslint/no-explicit-any': 'off',
        'brace-style': ['error', 'stroustrup', { allowSingleLine: true }]
    },
    settings: {
        react: {
            version: 'detect'
        }
    }
};
