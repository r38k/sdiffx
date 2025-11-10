/**
 * String replacement utilities for applying diff-based changes
 */

export interface Replacement {
  original: string;
  replacement: string;
  position?: number;
  lineNumber?: number;
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
