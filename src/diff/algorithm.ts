/**
 * Diff algorithm implementation using longest common subsequence
 */

import { DiffEntry, DiffResult, DiffType } from './types.js';
import { normalizeLine } from '../utils/markdown.js';

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
 * Calculate edit distance (Levenshtein) between two strings
 * Returns a score from 0 (completely different) to 1 (identical)
 */
function calculateSimilarity(a: string, b: string): number {
  // First normalize both strings for comparison
  const normA = normalizeLine(a);
  const normB = normalizeLine(b);

  // Check normalized equality first
  if (normA === normB) return 1;
  if (normA.length === 0 || normB.length === 0) return 0;

  const maxLen = Math.max(normA.length, normB.length);
  let distance = 0;

  // Simple character-based similarity for Japanese text
  const minLen = Math.min(normA.length, normB.length);
  for (let i = 0; i < minLen; i++) {
    if (normA[i] !== normB[i]) {
      distance++;
    }
  }
  distance += Math.abs(normA.length - normB.length);

  return 1 - distance / maxLen;
}

/**
 * Find best matching line in target array based on similarity
 */
function findBestMatch(
  needle: string,
  haystack: string[],
  startIdx: number = 0,
): { index: number; similarity: number } | null {
  let bestMatch = null;
  let bestSimilarity = 0.5; // Minimum threshold

  for (let i = startIdx; i < haystack.length; i++) {
    const similarity = calculateSimilarity(needle, haystack[i]);
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestMatch = { index: i, similarity };
    }
  }

  return bestMatch;
}

/**
 * Improved Myers diff algorithm with similarity matching
 */
export function generateDiffMyers(original: string[], formatted: string[]): DiffResult {
  const entries: DiffEntry[] = [];
  const usedFormattedIndices = new Set<number>();

  // Process each original line
  for (let origIdx = 0; origIdx < original.length; origIdx++) {
    const origLine = original[origIdx];

    // Skip empty lines
    if (origLine.trim() === '') {
      continue;
    }

    // Try exact match first
    let matchIdx = -1;
    for (let formIdx = 0; formIdx < formatted.length; formIdx++) {
      if (!usedFormattedIndices.has(formIdx) && formatted[formIdx] === origLine) {
        matchIdx = formIdx;
        break;
      }
    }

    // If no exact match, try normalized match
    if (matchIdx === -1) {
      const normOrig = normalizeLine(origLine);
      for (let formIdx = 0; formIdx < formatted.length; formIdx++) {
        if (!usedFormattedIndices.has(formIdx) && normalizeLine(formatted[formIdx]) === normOrig) {
          matchIdx = formIdx;
          break;
        }
      }
    }

    // If still no match, try similarity match
    if (matchIdx === -1) {
      const bestMatch = findBestMatch(origLine, formatted);
      if (bestMatch && !usedFormattedIndices.has(bestMatch.index)) {
        matchIdx = bestMatch.index;
      }
    }

    if (matchIdx !== -1) {
      // Found a match
      entries.push({
        type: 'unchanged',
        content: origLine,
        lineNumber: origIdx + 1,
      });
      usedFormattedIndices.add(matchIdx);
    } else {
      // No match found - line was removed
      entries.push({
        type: 'removed',
        content: origLine,
        lineNumber: origIdx + 1,
      });
    }
  }

  // Add all unmatched formatted lines as added
  for (let formIdx = 0; formIdx < formatted.length; formIdx++) {
    if (!usedFormattedIndices.has(formIdx)) {
      const formLine = formatted[formIdx];
      if (formLine.trim() !== '') {
        entries.push({
          type: 'added',
          content: formLine,
          lineNumber: formIdx + 1,
        });
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
