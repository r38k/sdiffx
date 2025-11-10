#!/usr/bin/env node

/**
 * Main entry point for sdiffx CLI
 */

import fs from 'node:fs';
import React from 'react';
import { render } from 'ink';
import { App } from './cli/App.js';
import { AppInteractive } from './cli/AppInteractive.js';

type CliArgs = {
  interactive: boolean;
  files: string[];
};

const printUsage = (code = 1) => {
  console.error('Usage: sdiffx [-i|--interactive] <original-file> <formatted-file>');
  console.error('');
  console.error('Options:');
  console.error('  -i, --interactive   Enable interactive TUI mode');
  console.error('  -h, --help          Show this message');
  console.error('');
  console.error('Arguments:');
  console.error('  <original-file>    Path to original text file (before formatting)');
  console.error('  <formatted-file>   Path to formatted text file (after LLM formatting)');
  process.exit(code);
};

const parseArgs = (argv: string[]): CliArgs => {
  const result: CliArgs = { interactive: false, files: [] };
  let parsingFiles = false;

  for (const arg of argv) {
    if (parsingFiles) {
      result.files.push(arg);
      continue;
    }

    if (arg === '--') {
      parsingFiles = true;
      continue;
    }

    if (arg === '-i' || arg === '--interactive') {
      result.interactive = true;
      continue;
    }

    if (arg === '-h' || arg === '--help') {
      printUsage(0);
    }

    if (arg.startsWith('-')) {
      console.error(`Unknown option: ${arg}`);
      printUsage(1);
    }

    result.files.push(arg);
  }

  return result;
};

const { interactive, files } = parseArgs(process.argv.slice(2));

if (files.length < 2) {
  console.error('Missing required file arguments.');
  printUsage(1);
}

if (files.length > 2) {
  console.error('Too many file arguments provided.');
  printUsage(1);
}

const [originalFile, formattedFile] = files;

const ensureFileExists = (filePath: string, label: string) => {
  if (!fs.existsSync(filePath)) {
    console.error(`${label} not found: ${filePath}`);
    process.exit(1);
  }

  const stat = fs.statSync(filePath);
  if (!stat.isFile()) {
    console.error(`${label} is not a file: ${filePath}`);
    process.exit(1);
  }
};

ensureFileExists(originalFile, 'Original file');
ensureFileExists(formattedFile, 'Formatted file');

const Component = interactive ? AppInteractive : App;

render(
  React.createElement(Component, {
    originalFile,
    formattedFile,
  })
);
