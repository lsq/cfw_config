// eslint.config.mjs
import antfu from '@antfu/eslint-config';

export default antfu({
  rules: {
    'no-console': ['error', { allow: ['warn', 'log', 'error'] }],
    'unused-imports/no-unused-vars': ['off'],
    'regexp/no-unused-capturing-group': ['off'],
    'regexp/no-control-character': ['off'],
    'no-unused-vars': [
      'off',
      /*
      'error',
      {
        vars: 'all',
        args: 'after-used',
        ignoreRestSiblings: true,
        argsIgnorePattern: '^_', // 忽略以下划线开头的参数
        varsIgnorePattern: '^_', // 忽略以下划线开头的变量
      },
      */
    ],
  },
  ignores: ['strTest*.js', '*.log', 'if*.js', 'lib/**', '*.md', 'pnpm-lock.yaml'],
  gitignore: true,
  stylistic: {
    indent: 2,
    quotes: 'single',
    semi: true,
  },
});
