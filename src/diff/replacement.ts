/**
 * String replacement utilities for applying diff-based changes
 */

export interface Replacement {
  original: string;
  replacement: string;
  position?: number;
  lineNumber?: number;
}

export interface HistoryEntry {
  type: 'added' | 'removed';
  original: string;
  formatted: string;
  timestamp: number;
}

export interface HistoryRecord {
  key: string;
  entryIndex: number;
  entry: HistoryEntry;
}

export class ReplacementHistory {
  private stack: HistoryRecord[] = [];

  push(record: HistoryRecord): void {
    this.stack.push(record);
  }

  undo(): HistoryRecord | null {
    if (this.stack.length === 0) {
      return null;
    }
    return this.stack.pop() ?? null;
  }

  clear(): void {
    this.stack = [];
  }

  size(): number {
    return this.stack.length;
  }

  canUndo(): boolean {
    return this.stack.length > 0;
  }

  getEntries(): HistoryRecord[] {
    return [...this.stack];
  }
}

export interface ReplacementInstruction {
  type: 'added' | 'removed';
  snippet: string;
  anchor?: string;
  anchorPosition?: 'before' | 'after';
}

/**
 * Apply replacements map to original text
 * Replaces instances of keys with values from the map
 */
export function applyReplacements(text: string, replacements: Map<string, string>): string {
  let result = text;

  // Sort by length (descending) to replace longer strings first
  const entries = Array.from(replacements.entries()).sort((a, b) => b[0].length - a[0].length);

  for (const [original, replacement] of entries) {
    // Replace all occurrences (case-sensitive)
    const regex = new RegExp(escapeRegex(original), 'g');
    result = result.replace(regex, replacement);
  }

  return result;
}

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function serializeInstruction(instruction: ReplacementInstruction): string {
  return JSON.stringify(instruction);
}

export function deserializeInstruction(payload: string): ReplacementInstruction {
  try {
    const parsed = JSON.parse(payload) as ReplacementInstruction;
    if (!parsed || !parsed.type || !parsed.snippet) {
      throw new Error('Invalid replacement instruction');
    }
    return {
      anchorPosition: parsed.anchorPosition ?? 'after',
      ...parsed,
    };
  } catch (err) {
    throw new Error(
      `Failed to parse replacement instruction: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

export function findMatchingLine(text: string, needle: string): string | null {
  if (!needle) {
    return null;
  }

  const normalizedNeedle = needle.trim();
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    if (line === needle) {
      return line;
    }
  }

  for (const line of lines) {
    if (line.trim() === normalizedNeedle) {
      return line;
    }
  }

  for (const line of lines) {
    if (line.includes(normalizedNeedle)) {
      return line;
    }
  }

  return null;
}

/**
 * Create a replacement map from added lines to be applied
 */
export function createReplacementMap(
  addedLines: string[],
  applySuggestions: boolean = false,
): Map<string, string> {
  const replacements = new Map<string, string>();

  // For now, just add the lines as-is
  // In batch mode, all additions are accepted
  // In interactive mode, user selects which ones to apply
  for (const line of addedLines) {
    replacements.set(line, line);
  }

  return replacements;
}

/**
 * Generate a formatted patch showing what would be changed
 */
export function generatePatch(
  original: string,
  replacements: Map<string, string>,
): string {
  const lines = original.split('\n');
  const patched = applyReplacements(original, replacements);
  const patchedLines = patched.split('\n');

  let patch = '';
  for (let i = 0; i < Math.max(lines.length, patchedLines.length); i++) {
    const origLine = lines[i] || '';
    const patchedLine = patchedLines[i] || '';

    if (origLine !== patchedLine) {
      patch += `- ${origLine}\n`;
      patch += `+ ${patchedLine}\n`;
    }
  }

  return patch;
}
