#!/usr/bin/env node

/**
 * Interactive entry point for sdiff CLI
 * Supports interactive diff viewing and replacement
 */

import React from 'react';
import { render } from 'ink';
import { AppInteractive } from './cli/AppInteractive.js';

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Usage: sdiff-interactive <original-file> <formatted-file>');
  console.error('');
  console.error('Interactive mode features:');
  console.error('  - View diffs with full control');
  console.error('  - Choose to apply changes interactively');
  console.error('  - Batch or selective replacements');
  console.error('');
  console.error('Keyboard shortcuts:');
  console.error('  r - Start replacement mode');
  console.error('  q - Quit without changes');
  console.error('  y - Confirm replacement (in interactive mode)');
  console.error('  n - Skip replacement (in interactive mode)');
  process.exit(1);
}

const [originalFile, formattedFile] = args;

const app = React.createElement(AppInteractive, {
  originalFile,
  formattedFile,
});

render(app);
