#!/usr/bin/env node

/**
 * Compatibility entry point for an optional `sdiffx-interactive` alias.
 * Delegates to the main CLI with the interactive flag enabled.
 */

process.argv.splice(2, 0, '-i');

const bootstrap = async () => {
  await import('./index.js');
};

void bootstrap();
