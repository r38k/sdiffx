#!/usr/bin/env node

/**
 * Main entry point for sdiff CLI
 */

import React from 'react';
import { render } from 'ink';
import { App } from './cli/App.js';

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Usage: sdiff <original-file> <formatted-file>');
  console.error('');
  console.error('Options:');
  console.error('  <original-file>   Path to original text file (before formatting)');
  console.error('  <formatted-file>  Path to formatted text file (after LLM formatting)');
  process.exit(1);
}

const [originalFile, formattedFile] = args;

const app = React.createElement(App, {
  originalFile,
  formattedFile,
});

render(app);
