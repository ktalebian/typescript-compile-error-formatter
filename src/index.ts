import os from 'os';
import fs from 'fs';

import { Issue, IssueLocation, IssueSeverity } from 'fork-ts-checker-webpack-plugin/lib/issue';
import { Formatter } from 'fork-ts-checker-webpack-plugin/lib/formatter';
import chalk from 'chalk';
import { codeFrameColumns } from '@babel/code-frame';

export { Issue };

interface IssueFunctional {
  getOrigin: () => string;
  getSeverity: () => IssueSeverity;
  getCode: () => string;
  getMessage: () => string;
  getFile?: () => string;
  getLine?: () => number;
  getLocation?: () => IssueLocation;
}

const IssueOrigin = {
  TYPESCRIPT: 'typescript',
  ESLINT: 'eslint',
  INTERNAL: 'internal',
} as const;
const IssueSeverity = {
  ERROR: 'error',
  WARNING: 'warning',
} as const;

const decomposeIssue = (issue: Issue | IssueFunctional): Issue => {
  if ('getOrigin' in issue && typeof issue.getOrigin === 'function') {
    return {
      origin: issue.getOrigin(),
      severity: issue.getSeverity(),
      code: issue.getCode(),
      message: issue.getMessage(),
      file: issue.getFile && issue.getFile(),
      location: issue.getLocation && issue.getLocation(),
    };
  }

  return issue as Issue;
};

const types = {
  typescript: 'TypeScript',
  lint: 'Lint',
  internal: 'Internal',
};

const formatter: Formatter = (issue, useColors = true) => {
  const { origin, severity, file, location, message, code } = decomposeIssue(issue);
  const isWarning = severity === IssueSeverity.WARNING;
  const { line, column } = location.start;

  const messageColor = isWarning ? chalk.yellow : chalk.red;
  const fileAndNumberColor = chalk.bold.cyan;

  const source = file && fs.existsSync(file) && fs.readFileSync(file, 'utf-8');
  const frame = source
    ? codeFrameColumns(source, { start: { line, column } }, { highlightCode: useColors })
        .split('\n')
        .map((str) => `  ${str}`)
        .join(os.EOL)
    : '';

  return [
    messageColor.bold(`${types[origin]} ${severity.toLowerCase()} in `) +
      fileAndNumberColor(`${file}(${line},${column})`) +
      messageColor(':'),
    `${message}  ${messageColor.underline((origin === IssueOrigin.ESLINT ? 'Rule: ' : 'TS') + code)}`,
    '',
    frame,
  ].join(os.EOL);
};

export default formatter;
