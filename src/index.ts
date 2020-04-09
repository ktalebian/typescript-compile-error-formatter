import os from 'os';
import fs from 'fs';

import chalk from 'chalk';
import { codeFrameColumns } from '@babel/code-frame';

interface MessageFunctional {
  getType: () => string;
  getSeverity: () => string;
  getFile: () => string;
  getLine: () => string;
  getContent: () => string;
  getCode: () => string;
  getCharacter: () => string;
  isWarningSeverity: () => boolean;
}

export interface Message {
  type: string;
  severity: string;
  file: string;
  line: string;
  content: string;
  code: string;
  character: string;
  isWarningSeverity: () => boolean;
}

const decomposeMessage = (message: Message | MessageFunctional): Message => {
  if ('getFile' in message && typeof message.getFile === 'function') {
    return {
      type: message.getFile(),
      severity: message.getSeverity(),
      file: message.getFile(),
      line: message.getLine(),
      content: message.getContent(),
      code: message.getCode(),
      character: message.getCharacter(),
      isWarningSeverity: message.isWarningSeverity,
    };
  }

  return message as Message;
};

const types = { diagnostic: 'TypeScript', lint: 'TSLint' };

export default (message: Message | MessageFunctional, useColors = true) => {
  const { type, severity, file, line, content, code, character, isWarningSeverity } = decomposeMessage(message);

  const messageColor = isWarningSeverity() ? chalk.yellow : chalk.red;
  const fileAndNumberColor = chalk.bold.cyan;

  const source = file && fs.existsSync(file) && fs.readFileSync(file, 'utf-8');
  const frame = source
    ? codeFrameColumns(source, { start: { line, column: character } }, { highlightCode: useColors })
        .split('\n')
        .map((str) => `  ${str}`)
        .join(os.EOL)
    : '';

  return [
    messageColor.bold(`${types[type]} ${severity.toLowerCase()} in `) +
      fileAndNumberColor(`${file}(${line},${character})`) +
      messageColor(':'),
    `${content}  ${messageColor.underline((type === 'lint' ? 'Rule: ' : 'TS') + code)}`,
    '',
    frame,
  ].join(os.EOL);
};
