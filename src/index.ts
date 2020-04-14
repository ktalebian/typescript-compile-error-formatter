import os from 'os';
import fs from 'fs';

import { IssueOrigin } from 'fork-ts-checker-webpack-plugin/lib/issue/IssueOrigin';
import { IssueSeverity } from 'fork-ts-checker-webpack-plugin/lib/issue/IssueSeverity';
import { Issue } from 'fork-ts-checker-webpack-plugin/lib/issue';
import chalk from 'chalk';
import { codeFrameColumns } from '@babel/code-frame';

export { IssueOrigin as Origin };
export { IssueSeverity as Severity };
export { Issue };

interface IssueFunctional {
  getOrigin: () => IssueOrigin;
  getSeverity: () => IssueSeverity;
  getCode: () => string;
  getMessage: () => string;
  getFile?: () => string;
  getLine?: () => number;
  getCharacter?: () => number;
  getStack?: () => string;
}

const decomposeIssue = (issue: Issue | IssueFunctional): Issue => {
  if ('getOrigin' in issue && typeof issue.getOrigin === 'function') {
    return {
      origin: issue.getOrigin(),
      severity: issue.getSeverity(),
      code: issue.getCode(),
      message: issue.getMessage(),
      file: issue.getFile && issue.getFile(),
      line: issue.getLine && issue.getLine(),
      character: issue.getCharacter && issue.getCharacter(),
      stack: issue.getStack && issue.getStack(),
    };
  }

  return issue as Issue;
};

const types = {
  typescript: 'TypeScript',
  lint: 'Lint',
  internal: 'Internal',
};

export default (issue: Issue | IssueFunctional, useColors = true) => {
  const { origin, severity, file, line, message, code, character } = decomposeIssue(issue);
  const isWarning = severity === IssueSeverity.WARNING;

  const messageColor = isWarning ? chalk.yellow : chalk.red;
  const fileAndNumberColor = chalk.bold.cyan;

  const source = file && fs.existsSync(file) && fs.readFileSync(file, 'utf-8');
  const frame = source
    ? codeFrameColumns(source, { start: { line, column: character } }, { highlightCode: useColors })
        .split('\n')
        .map((str) => `  ${str}`)
        .join(os.EOL)
    : '';

  return [
    messageColor.bold(`${types[origin]} ${severity.toLowerCase()} in `) +
      fileAndNumberColor(`${file}(${line},${character})`) +
      messageColor(':'),
    `${message}  ${messageColor.underline((origin === IssueOrigin.ESLINT ? 'Rule: ' : 'TS') + code)}`,
    '',
    frame,
  ].join(os.EOL);
};
