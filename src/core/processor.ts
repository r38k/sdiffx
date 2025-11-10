/**
 * Core processor for file comparison
 */

import * as fs from 'fs';
import { stripMarkdown, splitBySentence } from '../utils/markdown.js';
import { generateDiffMyers } from '../diff/algorithm.js';
import { FileComparison } from '../diff/types.js';

/**
 * Read file from path
 */
export function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Compare two text files and generate diff
 */
export function compareFiles(originalPath: string, formattedPath: string): FileComparison {
  const originalText = readFile(originalPath);
  const formattedText = readFile(formattedPath);

  return compareTexts(originalText, formattedText);
}

/**
 * Compare two text strings and generate diff
 */
export function compareTexts(originalText: string, formattedText: string): FileComparison {
  // Strip markdown from formatted text
  const originalCleaned = stripMarkdown(originalText);
  const formattedCleaned = stripMarkdown(formattedText);

  // Split into sentences
  const originalSentences = splitBySentence(originalCleaned);
  const formattedSentences = splitBySentence(formattedCleaned);

  // Generate diff
  const diffs = generateDiffMyers(originalSentences, formattedSentences);

  return {
    original: originalText,
    formatted: formattedText,
    diffs,
  };
}

/**
 * Apply replacements to formatted text
 */
export function applyReplacements(text: string, replacements: Array<{ old: string; new: string }>): string {
  let result = text;
  for (const { old, new: newStr } of replacements) {
    result = result.replace(old, newStr);
  }
  return result;
}
