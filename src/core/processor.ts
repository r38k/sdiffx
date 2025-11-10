/**
 * Core processor for file comparison
 */

import * as fs from 'fs';
import { stripMarkdown, splitBySentence } from '../utils/markdown.js';
import { generateDiffMyers } from '../diff/algorithm.js';
import { FileComparison } from '../diff/types.js';
import { deserializeInstruction, ReplacementInstruction } from '../diff/replacement.js';

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

export function writeFile(filePath: string, content: string): void {
  fs.writeFileSync(filePath, content, 'utf-8');
}

export function applyReplacementsToFile(
  originalPath: string,
  formattedPath: string,
  replacements: Map<string, string>,
): string {
  const original = readFile(originalPath);
  const formatted = readFile(formattedPath);

  if (replacements.size === 0) {
    return formatted;
  }

  let result = formatted;

  for (const [, payload] of replacements.entries()) {
    const instruction = deserializeInstruction(payload);
    result = applyInstruction(result, instruction, original);
  }

  writeFile(formattedPath, result);
  return result;
}

function applyInstruction(target: string, instruction: ReplacementInstruction, original: string): string {
  if (instruction.type === 'added') {
    return removeSnippet(target, instruction.snippet);
  }

  const snippet = instruction.snippet || findSnippetNearAnchor(original, instruction.anchor) || '';
  return insertSnippet(target, snippet, instruction.anchor, instruction.anchorPosition);
}

function findSnippetNearAnchor(text: string, anchor?: string): string | null {
  if (!anchor) {
    return null;
  }

  const anchorIndex = text.indexOf(anchor);
  if (anchorIndex === -1) {
    return null;
  }

  const endOfAnchor = anchorIndex + anchor.length;
  const remaining = text.slice(endOfAnchor);
  const nextNewline = remaining.indexOf('\n');
  if (nextNewline === -1) {
    const candidate = remaining.trim();
    return candidate.length > 0 ? candidate : null;
  }
  const snippet = remaining.slice(0, nextNewline).trim();
  return snippet.length > 0 ? snippet : null;
}

function normalizeSnippet(snippet: string): string {
  return snippet.replace(/\r?\n$/, '');
}

function removeSnippet(source: string, snippet: string): string {
  if (!snippet) {
    return source;
  }

  const normalized = normalizeSnippet(snippet);
  const candidates = [normalized + '\n', '\n' + normalized, normalized];
  for (const pattern of candidates) {
    const index = source.indexOf(pattern);
    if (index !== -1) {
      return source.slice(0, index) + source.slice(index + pattern.length);
    }
  }
  return source;
}

function insertSnippet(
  source: string,
  snippet: string,
  anchor?: string,
  anchorPosition: 'before' | 'after' = 'after',
): string {
  if (!snippet) {
    return source;
  }

  const trimmedSnippet = normalizeSnippet(snippet);
  const insertion = trimmedSnippet.endsWith('\n') ? trimmedSnippet : `${trimmedSnippet}\n`;

  if (!anchor) {
    return source.trimEnd() + '\n' + insertion;
  }

  const anchorIndex = source.indexOf(anchor);
  if (anchorIndex === -1) {
    return source.trimEnd() + '\n' + insertion;
  }

  if (anchorPosition === 'before') {
    return source.slice(0, anchorIndex) + insertion + source.slice(anchorIndex);
  }

  const insertPoint = anchorIndex + anchor.length;
  return source.slice(0, insertPoint) + '\n' + insertion + source.slice(insertPoint);
}
