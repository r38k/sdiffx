/**
 * Core processor for file comparison
 */

import * as fs from 'fs';
import { extractParagraphMappings, normalizeDocumentText, ParagraphMapping } from '../utils/markdown.js';
import { generateDiffMyers } from '../diff/algorithm.js';
import { DiffEntry, FileComparison } from '../diff/types.js';
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
  const originalParagraphs = extractParagraphMappings(originalText);
  const formattedParagraphs = extractParagraphMappings(formattedText);

  const normalizedOriginal = originalParagraphs.map((p) => p.normalized).join('\n');
  const normalizedFormatted = formattedParagraphs.map((p) => p.normalized).join('\n');

  const rawDiffs = generateDiffMyers(normalizedOriginal, normalizedFormatted);
  const hydratedEntries = hydrateDiffEntries(rawDiffs.entries, originalParagraphs, formattedParagraphs);
  const diffs = { entries: hydratedEntries, summary: rawDiffs.summary };

  return {
    original: originalText,
    formatted: formattedText,
    diffs,
  };
}

function createParagraphIndex(paragraphs: ParagraphMapping[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const block of paragraphs) {
    if (!block.normalized) {
      continue;
    }
    const existing = map.get(block.normalized);
    if (existing) {
      existing.push(block.display || block.normalized);
    } else {
      map.set(block.normalized, [block.display || block.normalized]);
    }
  }
  return map;
}

function takeDisplay(map: Map<string, string[]>, key: string): string | null {
  const queue = map.get(key);
  if (!queue || queue.length === 0) {
    return null;
  }
  const value = queue.shift();
  return value ?? null;
}

function hydrateDiffEntries(
  entries: DiffEntry[],
  originalParagraphs: ParagraphMapping[],
  formattedParagraphs: ParagraphMapping[],
): DiffEntry[] {
  const originalMap = createParagraphIndex(originalParagraphs);
  const formattedMap = createParagraphIndex(formattedParagraphs);

  return entries.map((entry) => {
    const key = entry.content;
    let display: string | null = null;
    if (entry.type === 'added') {
      display = takeDisplay(formattedMap, key);
    } else if (entry.type === 'removed') {
      display = takeDisplay(originalMap, key);
    } else {
      display = takeDisplay(formattedMap, key) ?? takeDisplay(originalMap, key);
    }
    return {
      ...entry,
      content: display && display.length > 0 ? display : entry.content,
    };
  });
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
  let original: string;
  let formatted: string;

  try {
    original = readFile(originalPath);
    formatted = readFile(formattedPath);
  } catch (err) {
    throw new Error(
      `Failed to read files for replacement: ${formatErrorMessage(err)}`,
    );
  }

  if (replacements.size === 0) {
    return formatted;
  }

  let result = formatted;

  for (const [key, payload] of replacements.entries()) {
    try {
      const instruction = deserializeInstruction(payload);
      result = applyInstruction(result, instruction, original);
    } catch (err) {
      throw new Error(
        `Failed to apply replacement '${key}': ${formatErrorMessage(err)}`,
      );
    }
  }

  try {
    writeFile(formattedPath, result);
  } catch (err) {
    throw new Error(
      `Failed to write replacements to ${formattedPath}: ${formatErrorMessage(err)}`,
    );
  }
  return result;
}

function applyInstruction(target: string, instruction: ReplacementInstruction, original: string): string {
  if (instruction.type === 'added') {
    return removeSnippet(target, instruction.snippet);
  }

  const snippet =
    instruction.snippet ||
    findSnippetNearAnchor(original, instruction.anchor, instruction.anchorPosition) ||
    '';
  return insertSnippet(target, snippet, instruction.anchor, instruction.anchorPosition);
}

function findSnippetNearAnchor(
  text: string,
  anchor?: string,
  position: 'before' | 'after' = 'after',
): string | null {
  if (!anchor) {
    return null;
  }

  const normalizedText = text.replace(/\r/g, '');
  const normalizedAnchor = anchor.replace(/\r/g, '');
  const anchorLength = normalizedAnchor.length;

  if (anchorLength === 0) {
    return null;
  }

  const locations: number[] = [];
  let searchIndex = 0;
  while (searchIndex < normalizedText.length) {
    const idx = normalizedText.indexOf(normalizedAnchor, searchIndex);
    if (idx === -1) {
      break;
    }
    locations.push(idx);
    searchIndex = idx + anchorLength;
  }

  if (locations.length === 0) {
    return null;
  }

  const orderedPositions = position === 'before' ? [...locations].reverse() : locations;

  for (const location of orderedPositions) {
    const candidate =
      position === 'before'
        ? extractLineBefore(normalizedText, location)
        : extractLineAfter(normalizedText, location + anchorLength);
    if (candidate) {
      return candidate;
    }
  }

  return null;
}

function extractLineAfter(text: string, startIdx: number): string | null {
  const remainder = text.slice(startIdx);
  const segments = remainder.split(/\r?\n/);
  for (const segment of segments) {
    if (segment.trim().length > 0) {
      return segment;
    }
  }
  return null;
}

function extractLineBefore(text: string, anchorIdx: number): string | null {
  const leading = text.slice(0, anchorIdx);
  const segments = leading.split(/\r?\n/).reverse();
  for (const segment of segments) {
    if (segment.trim().length > 0) {
      return segment;
    }
  }
  return null;
}

function normalizeSnippet(snippet: string): string {
  return snippet.replace(/\r?\n$/, '');
}

function removeSnippet(source: string, snippet: string): string {
  if (!snippet) {
    return source;
  }

  const sanitizedSnippet = snippet.replace(/\r/g, '');
  const snippetLines = sanitizedSnippet
    .split(/\n/)
    .filter((line) => line.trim().length > 0);

  if (snippetLines.length > 0) {
    const sourceLines = source.split(/\r?\n/);
    for (let i = 0; i <= sourceLines.length - snippetLines.length; i++) {
      let matches = true;
      for (let j = 0; j < snippetLines.length; j++) {
        if (sourceLines[i + j].trim() !== snippetLines[j].trim()) {
          matches = false;
          break;
        }
      }
      if (matches) {
        sourceLines.splice(i, snippetLines.length);
        return sourceLines.join('\n');
      }
    }
  }

  const fallback = removeDirectMatch(source, sanitizedSnippet);
  return fallback ?? source;
}

function removeDirectMatch(source: string, needle: string): string | null {
  if (!needle) {
    return null;
  }
  const index = source.indexOf(needle);
  if (index === -1) {
    return null;
  }
  const before = source.slice(0, index);
  const after = source.slice(index + needle.length);
  if (before.endsWith('\n') && after.startsWith('\n')) {
    return before + after.slice(1);
  }
  return before + after;
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

function formatErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
