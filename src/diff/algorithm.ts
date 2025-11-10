/**
 * Diff algorithm implementation using longest common subsequence
 */

import { DiffEntry, DiffResult, DiffType } from './types.js';

/**
 * Calculate longest common subsequence between two sequences
 */
function lcs(a: string[], b: string[]): string[] {
  const m = a.length;
  const n = b.length;

  // Create DP table
  const dp: number[][] = Array(m + 1)
    .fill(0)
    .map(() => Array(n + 1).fill(0));

  // Fill DP table
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Reconstruct LCS
  const result: string[] = [];
  let i = m;
  let j = n;

  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      result.unshift(a[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return result;
}

/**
 * Generate diff between two sentences arrays
 */
export function generateDiff(original: string[], formatted: string[]): DiffResult {
  const lcsResult = lcs(original, formatted);
  const lcsSet = new Set(lcsResult);

  const entries: DiffEntry[] = [];
  let origIdx = 0;
  let formIdx = 0;

  while (origIdx < original.length || formIdx < formatted.length) {
    if (
      origIdx < original.length &&
      lcsSet.has(original[origIdx]) &&
      original[origIdx] === formatted[formIdx]
    ) {
      // Found matching sentence
      entries.push({
        type: 'unchanged',
        content: original[origIdx],
        lineNumber: origIdx + 1,
      });
      origIdx++;
      formIdx++;
    } else if (origIdx < original.length && !lcsSet.has(original[origIdx])) {
      // Sentence removed from original
      entries.push({
        type: 'removed',
        content: original[origIdx],
        lineNumber: origIdx + 1,
      });
      origIdx++;
    } else if (formIdx < formatted.length && !lcsSet.has(formatted[formIdx])) {
      // Sentence added in formatted
      entries.push({
        type: 'added',
        content: formatted[formIdx],
        lineNumber: formIdx + 1,
      });
      formIdx++;
    } else {
      // Try to match with next items
      if (origIdx < original.length) {
        entries.push({
          type: 'removed',
          content: original[origIdx],
          lineNumber: origIdx + 1,
        });
        origIdx++;
      }
      if (formIdx < formatted.length) {
        entries.push({
          type: 'added',
          content: formatted[formIdx],
          lineNumber: formIdx + 1,
        });
        formIdx++;
      }
    }
  }

  // Calculate summary
  const summary = {
    total: entries.length,
    added: entries.filter((e) => e.type === 'added').length,
    removed: entries.filter((e) => e.type === 'removed').length,
    unchanged: entries.filter((e) => e.type === 'unchanged').length,
  };

  return { entries, summary };
}

/**
 * Simple Myers diff algorithm for better diff quality
 */
export function generateDiffMyers(original: string[], formatted: string[]): DiffResult {
  const entries: DiffEntry[] = [];

  // Use a simpler greedy approach: match consecutive identical strings
  let origIdx = 0;
  let formIdx = 0;

  while (origIdx < original.length || formIdx < formatted.length) {
    // Look for matching string
    let matchFound = false;

    if (origIdx < original.length && formIdx < formatted.length && original[origIdx] === formatted[formIdx]) {
      entries.push({
        type: 'unchanged',
        content: original[origIdx],
        lineNumber: origIdx + 1,
      });
      origIdx++;
      formIdx++;
      matchFound = true;
    }

    if (!matchFound) {
      // Try to find the next match
      let nextOrigMatch = -1;
      let nextFormMatch = -1;

      for (let i = origIdx + 1; i < original.length; i++) {
        if (original[i] === formatted[formIdx]) {
          nextOrigMatch = i;
          break;
        }
      }

      for (let j = formIdx + 1; j < formatted.length; j++) {
        if (formatted[j] === original[origIdx]) {
          nextFormMatch = j;
          break;
        }
      }

      // Prefer the closer match
      if (nextOrigMatch !== -1 && (nextFormMatch === -1 || nextOrigMatch - origIdx <= nextFormMatch - formIdx)) {
        // Mark everything in original until nextOrigMatch as removed
        while (origIdx < nextOrigMatch) {
          entries.push({
            type: 'removed',
            content: original[origIdx],
            lineNumber: origIdx + 1,
          });
          origIdx++;
        }
      } else if (nextFormMatch !== -1) {
        // Mark everything in formatted until nextFormMatch as added
        while (formIdx < nextFormMatch) {
          entries.push({
            type: 'added',
            content: formatted[formIdx],
            lineNumber: formIdx + 1,
          });
          formIdx++;
        }
      } else {
        // No more matches, mark remaining
        while (origIdx < original.length) {
          entries.push({
            type: 'removed',
            content: original[origIdx],
            lineNumber: origIdx + 1,
          });
          origIdx++;
        }
        while (formIdx < formatted.length) {
          entries.push({
            type: 'added',
            content: formatted[formIdx],
            lineNumber: formIdx + 1,
          });
          formIdx++;
        }
      }
    }
  }

  // Calculate summary
  const summary = {
    total: entries.length,
    added: entries.filter((e) => e.type === 'added').length,
    removed: entries.filter((e) => e.type === 'removed').length,
    unchanged: entries.filter((e) => e.type === 'unchanged').length,
  };

  return { entries, summary };
}
