#!/usr/bin/env node

/**
 * Compatibility entry point for `sdiffx-interactive`.
 * Delegates to the main CLI with the interactive flag enabled.
 */

process.argv.splice(2, 0, '-i');

const bootstrap = async () => {
  await import('./index.js');
};

void bootstrap();
