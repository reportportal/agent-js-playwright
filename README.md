The report project was updated according to the task 3
for those changes bellow:
1. HTML Report Configuration
The Playwright configuration (playwright.config.ts) is set to generate an HTML report for each test run.
Traces, screenshots, and videos are saved only for failed test scenarios to optimize storage and focus on relevant debugging information.
Example configuration:
js


use: {
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
  trace: 'retain-on-failure',
},
reporter: [
  ['html', { open: 'never' }],
  // ...
],
To view the HTML report after a run:
bash


npx playwright show-report
2. JUnit Report Generation
The Playwright config includes the JUnit reporter, which generates a JUnit XML file on every test run.
Example configuration:
js


reporter: [
  ['junit', { outputFile: 'results/junit-report.xml' }],
  // ...
],
The JUnit report can be used for CI/CD integration and test result tracking.
3. Report Portal Integration
The project is integrated with Report Portal using the official Playwright agent.
The configuration uses a personal project and API key for authentication.
Example configuration:
js


reporter: [
  ['@reportportal/agent-js-playwright', {
    apiKey: '<YOUR_API_KEY>',
    endpoint: 'https://your.reportportal.server/api/v2',
    project: '<your_personal_project>',
    launch: 'CloudCalculatorTests',
    description: 'Playwright Cloud Calculator test run',
  }],
  // ...
],
All test results are automatically sent to Report Portal for centralized reporting and analysis.
4. ESLint Integration
ESLint and recommended plugins are installed as dev dependencies:
bash


npm install --save-dev eslint eslint-plugin-playwright eslint-plugin-prettier eslint-config-prettier prettier
ESLint is configured to:
Use the Playwright and Prettier plugins.
Ignore files and folders such as node_modules/, dist/, and results/.
Adjust error levels for specific rules (e.g., allow console.log, warn on skipped tests, error on focused tests).
Example .eslintrc.js:
js


module.exports = {
  env: { node: true, es2021: true },
  extends: [
    'eslint:recommended',
    'plugin:playwright/recommended',
    'plugin:prettier/recommended',
  ],
  plugins: ['playwright', 'prettier'],
  rules: {
    'no-console': 'off',
    'prettier/prettier': ['error', { endOfLine: 'auto' }],
    'playwright/no-skipped-test': 'warn',
    'playwright/no-focused-test': 'error',
  },
  ignorePatterns: ['node_modules/', 'results/', 'dist/', '*.config.js'],
};
5. ESLint Scripts in package.json
The following scripts are available for linting and formatting:
json


"scripts": {
  "lint": "eslint . --ext .js,.ts",
  "lint:fix": "eslint . --ext .js,.ts --fix",
  "format": "prettier --write ."
}
Run npm run lint to check code style, and npm run lint:fix to auto-fix issues.

6. Production-Only Repository
The repository contains only production code, test code, configuration files, and documentation.
Unnecessary files (e.g., temporary files, old configs, node_modules, build artifacts) are excluded.

7. Clean Console Output
Console output is kept clean and focused on essential information.
Unnecessary console.log statements are removed from production and test code.
Playwright and ESLint outputs are concise and relevant.